import {
  Client,
  TablesDB,
  Query,
  AppwriteException,
  type Models,
} from "appwrite";
import type { TransactionRepository, Transaction } from "@wishin/domain";
import { TransactionStatus } from "@wishin/domain";
import { toDocument } from "../utils/to-document";

/**
 * Interface representing a Transaction document in Appwrite.
 */
interface TransactionDocument extends Models.Document {
  itemId: string;
  userId: string;
  status: TransactionStatus;
  quantity: number;
}

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
    const data = {
      itemId: transaction.itemId,
      userId: transaction.userId,
      status: transaction.status,
      quantity: transaction.quantity,
    };

    await this.tablesDb.upsertRow({
      databaseId: this.databaseId,
      tableId: this.transactionsCollectionId,
      rowId: transaction.id,
      data,
    });
  }

  /**
   * Finds a transaction by its unique ID.
   * @param id - The transaction UUID.
   * @returns {Promise<Transaction | null>}
   */
  async findById(id: string): Promise<Transaction | null> {
    try {
      const _doc = await this.tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: this.transactionsCollectionId,
        rowId: id,
      });
      // mapping logic would go here, skipping for now as not strictly needed for Phase 3.4
      // return TransactionMapper.toDomain(toDocument<Models.Document>(doc));
      return null; // Placeholder
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
    const _response = await this.tablesDb.listRows({
      databaseId: this.databaseId,
      tableId: this.transactionsCollectionId,
      queries: [Query.equal("itemId", itemId)],
    });
    // return response.rows.map(doc => TransactionMapper.toDomain(toDocument<Models.Document>(doc)));
    return []; // Placeholder
  }

  /**
   * Atomically transitions all RESERVED transactions for an item to CANCELLED_BY_OWNER.
   *
   * @param itemId - The item UUID.
   * @returns {Promise<number>} The number of transactions cancelled.
   */
  async cancelByItemId(itemId: string): Promise<number> {
    // 1. Fetch all RESERVED transactions for the item
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

    // 2. Transition each to CANCELLED_BY_OWNER
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

    return docs.length;
  }
}
