import {
  Client,
  TablesDB,
  Query,
  AppwriteException,
  type Models,
} from "appwrite";
import type { TransactionRepository, Transaction } from "@wishin/domain";
import { TransactionStatus } from "@wishin/domain";
import {
  TransactionMapper,
  type TransactionDocument,
} from "../mappers/transaction.mapper";
import { toDocument } from "../utils/to-document";

/**
 * Appwrite implementation of the TransactionRepository.
 */
export class AppwriteTransactionRepository implements TransactionRepository {
  private readonly tablesDb: TablesDB;

  /**
   * Initializes the repository.
   *
   * @param client - The Appwrite Client SDK instance.
   * @param databaseId - The ID of the Appwrite database.
   * @param transactionsCollectionId - The ID of the transactions collection.
   */
  constructor(
    private readonly client: Client,
    private readonly databaseId: string,
    private readonly transactionsCollectionId: string,
  ) {
    this.tablesDb = new TablesDB(this.client);
  }

  /**
   * Persists a transaction aggregate.
   *
   * @param transaction - The transaction to save.
   */
  async save(transaction: Transaction): Promise<void> {
    await this.tablesDb.upsertRow({
      databaseId: this.databaseId,
      tableId: this.transactionsCollectionId,
      rowId: transaction.id,
      data: TransactionMapper.toPersistence(transaction),
    });
  }

  /**
   * Finds a transaction by its unique ID.
   * @param id - The transaction UUID.
   * @returns {Promise<Transaction | null>}
   */
  async findById(id: string): Promise<Transaction | null> {
    try {
      const doc = await this.tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: this.transactionsCollectionId,
        rowId: id,
      });

      return TransactionMapper.toDomain(toDocument<Models.Document>(doc));
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Finds all transactions associated with a specific wishlist item.
   * @param itemId - The item UUID.
   * @returns {Promise<Transaction[]>}
   */
  async findByItemId(itemId: string): Promise<Transaction[]> {
    const response = await this.tablesDb.listRows({
      databaseId: this.databaseId,
      tableId: this.transactionsCollectionId,
      queries: [Query.equal("itemId", itemId), Query.limit(100)],
    });

    const documents = toDocument<Models.Document[]>(response.rows);
    return documents.map((doc) => TransactionMapper.toDomain(doc));
  }

  /**
   * Atomically (relative to the client) transitions all RESERVED transactions for an item to CANCELLED_BY_OWNER.
   *
   * @remarks
   * **Atomicity Limitation**: Appwrite does not support server-side transactions or conditional updates
   * for bulk operations. This method implementation uses a paginated loop to fetch and update
   * records. In the event of a partial failure, some transactions may remain in the RESERVED state.
   * Concurrent reservations during execution may also result in a partial cancellation.
   *
   * @param itemId - The item UUID.
   * @returns {Promise<number>} The number of transactions cancelled.
   */
  async cancelByItemId(itemId: string): Promise<number> {
    let totalCancelled = 0;
    let hasMore = true;

    while (hasMore) {
      // 1. Fetch a page of RESERVED transactions for the item
      const response = await this.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: this.transactionsCollectionId,
        queries: [
          Query.equal("itemId", itemId),
          Query.equal("status", TransactionStatus.RESERVED),
          Query.limit(100),
        ],
      });

      const docs = toDocument<TransactionDocument[]>(response.rows);

      if (docs.length === 0) {
        hasMore = false;
        break;
      }

      // 2. Transition this page to CANCELLED_BY_OWNER
      const updates = docs.map((doc) =>
        this.tablesDb.updateRow({
          databaseId: this.databaseId,
          tableId: this.transactionsCollectionId,
          rowId: doc.$id,
          data: {
            status: TransactionStatus.CANCELLED_BY_OWNER,
          },
        }),
      );

      await Promise.all(updates);
      totalCancelled += docs.length;

      // If we got fewer than 100 docs, we know we've reached the end
      // However, since we are changing the status, the next query for RESERVED
      // will naturally return the next set of results or be empty.
      if (docs.length < 100) {
        hasMore = false;
      }
    }

    return totalCancelled;
  }
}
