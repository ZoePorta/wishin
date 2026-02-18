import {
  Client,
  TablesDB,
  Query,
  AppwriteException,
  type Models,
} from "appwrite";
import {
  type WishlistRepository,
  Wishlist,
  TransactionStatus,
} from "@wishin/domain";
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
        let cursor: string | undefined = undefined;
        do {
          const queries = [Query.equal("itemId", itemIds), Query.limit(100)];
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
}
