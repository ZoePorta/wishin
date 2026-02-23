import {
  Client,
  Account,
  TablesDB,
  Query,
  AppwriteException,
  type Models,
} from "appwrite";
import type { WishlistRepository } from "@wishin/domain";
import { Wishlist, TransactionStatus } from "@wishin/domain";
import { WishlistMapper } from "../mappers/wishlist.mapper";
import { WishlistItemMapper } from "../mappers/wishlist-item.mapper";
import { toDocument } from "../utils/to-document";

/**
 * Interface representing a Transaction document in Appwrite.
 */
interface TransactionDocument extends Models.Document {
  itemId: string | Models.Document;
  status: TransactionStatus;
  quantity: number;
}

/**
 * Appwrite implementation of the WishlistRepository.
 */
export class AppwriteWishlistRepository implements WishlistRepository {
  private readonly tablesDb: TablesDB;
  private readonly account: Account;

  /**
   * Initializes the repository.
   *
   * @param client - The Appwrite Client SDK instance.
   * @param databaseId - The ID of the Appwrite database.
   * @param wishlistCollectionId - The ID of the wishlists collection.
   * @param wishlistItemsCollectionId - The ID of the wishlist items collection.
   * @param transactionsCollectionId - The ID of the transactions collection.
   */
  constructor(
    private readonly client: Client,
    private readonly databaseId: string,
    private readonly wishlistCollectionId: string,
    private readonly wishlistItemsCollectionId: string,
    private readonly transactionsCollectionId: string,
  ) {
    this.tablesDb = new TablesDB(this.client);
    this.account = new Account(this.client);
  }

  /**
   * Ensures an active session exists.
   * Creates an anonymous session if no session is active.
   * // TODO: Replace with authenticated sessions once Phase 5 is implemented
   */
  async ensureSession(): Promise<void> {
    try {
      await this.account.get();
    } catch {
      await this.account.createAnonymousSession();
    }
  }

  /**
   * Finds a wishlist by its unique identifier.
   *
   * @param id - The UUID of the wishlist.
   * @returns A Promise that resolves to the Wishlist aggregate or null if not found.
   */
  async findById(id: string): Promise<Wishlist | null> {
    try {
      // 1. Fetch Wishlist Document
      const wishlistDoc = await this.tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: this.wishlistCollectionId,
        rowId: id,
      });

      // 2. Fetch Wishlist Items
      const itemsResponse = await this.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: this.wishlistItemsCollectionId,
        queries: [Query.equal("wishlistId", id)],
      });

      const itemDocuments = toDocument<Models.Document[]>(itemsResponse.rows);
      const itemIds = itemDocuments.map((doc) => doc.$id);

      // 3. Fetch Transactions for items (if any items exist)
      const transactions: TransactionDocument[] = [];
      if (itemIds.length > 0) {
        // Appwrite has a hard limit of 100 values for Query.equal
        // We must batch the queries if we have more than 100 items
        const CHUNK_SIZE = 100;
        const chunks = [];
        for (let i = 0; i < itemIds.length; i += CHUNK_SIZE) {
          chunks.push(itemIds.slice(i, i + CHUNK_SIZE));
        }

        for (const chunk of chunks) {
          let cursor: string | undefined = undefined;
          do {
            const queries = [Query.equal("itemId", chunk), Query.limit(100)];
            if (cursor) {
              queries.push(Query.cursorAfter(cursor));
            }

            const response = await this.tablesDb.listRows({
              databaseId: this.databaseId,
              tableId: this.transactionsCollectionId,
              queries,
            });

            const docs = toDocument<TransactionDocument[]>(response.rows);
            transactions.push(...docs);

            if (response.rows.length < 100) {
              cursor = undefined;
            } else {
              cursor = response.rows[response.rows.length - 1].$id;
            }
          } while (cursor);
        }
      }

      // 4. Calculate Quantities & Map
      // Group transactions by itemId using a Map for O(1) access
      const transactionsByItem = new Map<string, TransactionDocument[]>();
      for (const t of transactions) {
        const tItemId = typeof t.itemId === "string" ? t.itemId : t.itemId.$id;
        const currentTransactions = transactionsByItem.get(tItemId) ?? [];
        currentTransactions.push(t);
        transactionsByItem.set(tItemId, currentTransactions);
      }

      const items = itemDocuments.map((doc) => {
        const itemTransactions = transactionsByItem.get(doc.$id) ?? [];

        const reservedQuantity = itemTransactions
          .filter((t) => t.status === TransactionStatus.RESERVED)
          .reduce((sum, t) => sum + t.quantity, 0);

        const purchasedQuantity = itemTransactions
          .filter((t) => t.status === TransactionStatus.PURCHASED)
          .reduce((sum, t) => sum + t.quantity, 0);

        return WishlistItemMapper.toDomain(doc, {
          reservedQuantity,
          purchasedQuantity,
        });
      });

      return WishlistMapper.toDomain(
        toDocument<Models.Document>(wishlistDoc),
        items,
      );
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Persists a wishlist aggregate.
   * Synchronizes the main wishlist document and all its items.
   *
   * @param wishlist - The wishlist to save.
   */
  async save(wishlist: Wishlist): Promise<void> {
    // 1. Establish anonymous session for testing if needed
    await this.ensureSession();

    // 2. Upsert Wishlist Document
    await this.tablesDb.upsertRow({
      databaseId: this.databaseId,
      tableId: this.wishlistCollectionId,
      rowId: wishlist.id,
      data: WishlistMapper.toPersistence(wishlist),
    });

    // 3. Sync Wishlist Items
    // 3a. Get existing items IDs to identify removals
    const existingItemsResponse = await this.tablesDb.listRows({
      databaseId: this.databaseId,
      tableId: this.wishlistItemsCollectionId,
      queries: [Query.equal("wishlistId", wishlist.id)],
    });
    const existingItemIds = existingItemsResponse.rows.map((row) => row.$id);

    // 3b. Upsert current items
    const currentItems = wishlist.items;
    const currentItemIds = new Set(currentItems.map((item) => item.id));

    for (const item of currentItems) {
      await this.tablesDb.upsertRow({
        databaseId: this.databaseId,
        tableId: this.wishlistItemsCollectionId,
        rowId: item.id,
        data: WishlistItemMapper.toPersistence(item),
      });
    }

    // 3c. Delete removed items
    const itemIdsToDelete = existingItemIds.filter(
      (id) => !currentItemIds.has(id),
    );
    for (const id of itemIdsToDelete) {
      await this.tablesDb.deleteRow({
        databaseId: this.databaseId,
        tableId: this.wishlistItemsCollectionId,
        rowId: id,
      });
    }
  }

  /**
   * Deletes a wishlist by its unique identifier.
   * Cascading deletion handles items and transactions.
   *
   * @param id - The UUID of the wishlist to delete.
   */
  async delete(id: string): Promise<void> {
    try {
      await this.tablesDb.deleteRow({
        databaseId: this.databaseId,
        tableId: this.wishlistCollectionId,
        rowId: id,
      });
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        return; // Already deleted
      }
      throw error;
    }
  }
}
