import {
  Client,
  Account,
  TablesDB,
  Query,
  AppwriteException,
  type Models,
} from "appwrite";
import type {
  WishlistRepository,
  UserRepository,
  Wishlist,
} from "@wishin/domain";
import { TransactionStatus } from "@wishin/domain";
import { WishlistMapper } from "../mappers/wishlist.mapper";
import { WishlistItemMapper } from "../mappers/wishlist-item.mapper";
import { toDocument } from "../utils/to-document";
import type { SessionAwareRepository } from "./session-aware-repository.interface";

/**
 * Interface representing a Transaction document in Appwrite.
 */
interface TransactionDocument extends Models.Document {
  itemId: string | Models.Document;
  userId: string;
  status: TransactionStatus;
  quantity: number;
}

/**
 * Appwrite implementation of the WishlistRepository and UserRepository.
 */
export class AppwriteWishlistRepository
  implements WishlistRepository, UserRepository, SessionAwareRepository
{
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
   * Protected access for testing.
   */
  protected get accountAccess(): Account {
    return this.account;
  }

  /**
   * Protected access for testing.
   */
  protected get tablesDbAccess(): TablesDB {
    return this.tablesDb;
  }

  /**
   * Ensures an active session exists.
   * Creates an anonymous session if no session is active.
   * // TODO: Replace with authenticated sessions once Phase 5 is implemented
   */
  async ensureSession(): Promise<void> {
    try {
      await this.account.get();
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 401) {
        await this.account.createAnonymousSession();
        return;
      }
      throw error;
    }
  }

  /**
   * Finds a wishlist by its unique identifier.
   *
   * @param id - The UUID of the wishlist.
   * @param ensureSession - Whether to ensure an active session before querying (default: true).
   * @returns A Promise that resolves to the Wishlist aggregate or null if not found.
   */
  async findById(id: string, ensureSession = true): Promise<Wishlist | null> {
    if (ensureSession) {
      await this.ensureSession();
    }
    try {
      // 1. Fetch Wishlist Document
      const wishlistDoc = await this.tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: this.wishlistCollectionId,
        rowId: id,
      });

      // 2. Fetch Wishlist Items
      const itemDocuments: Models.Document[] = [];
      let itemsCursor: string | undefined = undefined;
      do {
        const queries = [Query.equal("wishlistId", id), Query.limit(100)];
        if (itemsCursor) {
          queries.push(Query.cursorAfter(itemsCursor));
        }
        const response = await this.tablesDb.listRows({
          databaseId: this.databaseId,
          tableId: this.wishlistItemsCollectionId,
          queries,
        });
        const docs = toDocument<Models.Document[]>(response.rows);
        itemDocuments.push(...docs);
        if (response.rows.length < 100) {
          itemsCursor = undefined;
        } else {
          itemsCursor = response.rows[response.rows.length - 1].$id;
        }
      } while (itemsCursor);

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
   * Finds a wishlist by its owner's identifier.
   *
   * @param ownerId - The identifier of the owner (UUID or Appwrite ID).
   * @returns A Promise that resolves to an array of Wishlist aggregates for the owner (empty array if none).
   */
  async findByOwnerId(ownerId: string): Promise<Wishlist[]> {
    await this.ensureSession();

    // 1. Fetch all Wishlist Documents by ownerId
    // Business Rule: Maximum 20 wishlists per owner (Post-MVP scaling limit)
    const response = await this.tablesDb.listRows({
      databaseId: this.databaseId,
      tableId: this.wishlistCollectionId,
      queries: [Query.equal("ownerId", ownerId), Query.limit(20)],
    });

    if (response.rows.length === 0) {
      return [];
    }

    const rows = toDocument<Models.Document[]>(response.rows);

    // 2. Map docs to aggregates by fetching details for each
    const wishlists = await Promise.all(
      rows.map((row) => this.findById(row.$id, false)),
    );

    // Filter out any nulls if findById could potentially return null
    return wishlists.filter((w): w is Wishlist => w !== null);
  }

  /**
   * Retrieves the current user's unique identifier.
   *
   * @returns A Promise that resolves to the current user ID.
   */
  async getCurrentUserId(): Promise<string> {
    await this.ensureSession();
    const user = await this.account.get();
    return user.$id;
  }

  /**
   * Persists a wishlist aggregate.
   * Synchronizes the main wishlist document and all its items.
   *
   * @param wishlist - The wishlist to save.
   */
  async save(wishlist: Wishlist): Promise<void> {
    // 1. Ensure active session
    await this.ensureSession();

    // 2. Sync Wishlist Items First (Atomicity step)
    // 2a. Get existing items IDs to identify removals
    const existingItemIds: string[] = [];
    let existingCursor: string | undefined = undefined;
    do {
      const queries = [
        Query.equal("wishlistId", wishlist.id),
        Query.limit(100),
      ];
      if (existingCursor) {
        queries.push(Query.cursorAfter(existingCursor));
      }
      const response = await this.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: this.wishlistItemsCollectionId,
        queries,
      });
      existingItemIds.push(...response.rows.map((row) => row.$id));

      if (response.rows.length < 100) {
        existingCursor = undefined;
      } else {
        existingCursor = response.rows[response.rows.length - 1].$id;
      }
    } while (existingCursor);

    // 2b. Prepare upserts and deletes
    const currentItems = wishlist.items;
    const currentItemIds = new Set(currentItems.map((item) => item.id));
    const itemIdsToDelete = existingItemIds.filter(
      (id) => !currentItemIds.has(id),
    );

    // 2c. Execute sync with retry logic
    const MAX_RETRIES = 2;
    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
      try {
        const upsertPromises = currentItems.map((item) =>
          this.tablesDb.upsertRow({
            databaseId: this.databaseId,
            tableId: this.wishlistItemsCollectionId,
            rowId: item.id,
            data: WishlistItemMapper.toPersistence(item),
          }),
        );

        const deletePromises = itemIdsToDelete.map(async (id) => {
          try {
            await this.tablesDb.deleteRow({
              databaseId: this.databaseId,
              tableId: this.wishlistItemsCollectionId,
              rowId: id,
            });
          } catch (error) {
            // Treat 404 (Not Found) as a success to ensure idempotency
            if (error instanceof AppwriteException && error.code === 404) {
              return;
            }
            throw error;
          }
        });

        await Promise.all([...upsertPromises, ...deletePromises]);
        break; // Success
      } catch (error) {
        attempt++;
        if (attempt > MAX_RETRIES) {
          console.error("Failed to sync wishlist items after retries:", error);
          throw error;
        }
        // Small backoff
        await new Promise((resolve) => setTimeout(resolve, attempt * 100));
      }
    }

    // 3. Upsert Wishlist Document AFTER successful item sync
    await this.tablesDb.upsertRow({
      databaseId: this.databaseId,
      tableId: this.wishlistCollectionId,
      rowId: wishlist.id,
      data: WishlistMapper.toPersistence(wishlist),
    });
  }

  /**
   * Deletes a wishlist by its unique identifier.
   * Cascading deletion handles items and transactions.
   *
   * @param id - The UUID of the wishlist to delete.
   */
  async delete(id: string): Promise<void> {
    await this.ensureSession();
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
