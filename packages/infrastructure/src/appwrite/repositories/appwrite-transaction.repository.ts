import {
  Client,
  Account,
  TablesDB,
  Query,
  AppwriteException,
  type Models,
} from "appwrite";
import { TransactionStatus } from "@wishin/domain";
import type { TransactionRepository, Transaction } from "@wishin/domain";
import {
  TransactionMapper,
  type TransactionDocument,
} from "../mappers/transaction.mapper";
import { toDocument } from "../utils/to-document";
import type { SessionAwareRepository } from "./session-aware-repository.interface";

/**
 * Appwrite implementation of the TransactionRepository.
 */
export class AppwriteTransactionRepository
  implements TransactionRepository, SessionAwareRepository
{
  private readonly tablesDb: TablesDB;
  private readonly account: Account;

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
    this.account = new Account(this.client);
  }

  /**
   * Ensures an active session exists.
   * Creates an anonymous session if no session is active.
   *
   * @returns {Promise<Models.User<Models.Preferences>>} The current user model.
   * @throws {AppwriteException} If a non-401 error occurs while fetching the account.
   */
  async ensureSession(): Promise<Models.User<Models.Preferences>> {
    try {
      return await this.account.get();
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 401) {
        await this.account.createAnonymousSession();
        return await this.account.get();
      }
      throw error;
    }
  }

  /**
   * Retrieves the current user's unique identifier.
   * @returns A Promise that resolves to the current user ID.
   * @throws {AppwriteException} If the account cannot be retrieved.
   */
  async getCurrentUserId(): Promise<string> {
    const user = await this.ensureSession();
    return user.$id;
  }

  /**
   * Persists a transaction aggregate.
   *
   * @param transaction - The transaction to save.
   * @returns {Promise<void>}
   * @throws {AppwriteException} If the upsert fails.
   */
  async save(transaction: Transaction): Promise<void> {
    await this.ensureSession();
    try {
      await this.tablesDb.upsertRow({
        databaseId: this.databaseId,
        tableId: this.transactionsCollectionId,
        rowId: transaction.id,
        data: TransactionMapper.toPersistence(transaction),
      });
    } catch (error) {
      console.error("AppwriteTransactionRepository.save error:", error);
      throw error;
    }
  }

  /**
   * Finds a transaction by its unique ID.
   *
   * @param id - The transaction UUID.
   * @returns {Promise<Transaction | null>}
   */
  async findById(id: string): Promise<Transaction | null> {
    await this.ensureSession();
    try {
      const doc = await this.tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: this.transactionsCollectionId,
        rowId: id,
      });

      // NOTE: Mapper implementation is currently a placeholder or partial
      return TransactionMapper.toDomain(toDocument<Models.Document>(doc));
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        return null; // Not found
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
    await this.ensureSession();
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
    await this.ensureSession();
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

  /**
   * Finds all transactions for a specific user.
   * @param userId - The user identity.
   * @param status - Optional filter by transaction status.
   * @param limit - Optional maximum number of transactions to return (default: no limit).
   * @returns {Promise<Transaction[]>}
   */
  async findByUserId(
    userId: string,
    status?: TransactionStatus,
    limit?: number,
  ): Promise<Transaction[]> {
    await this.ensureSession();

    const allTransactions: Transaction[] = [];
    let hasMore = true;
    let offset = 0;

    while (hasMore) {
      const remaining = limit ? limit - allTransactions.length : 100;
      if (limit && remaining <= 0) {
        hasMore = false;
        break;
      }

      const queries = [
        Query.equal("userId", userId),
        Query.limit(Math.min(100, remaining)),
        Query.offset(offset),
      ];

      if (status) {
        queries.push(Query.equal("status", status));
      }

      const response = await this.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: this.transactionsCollectionId,
        queries,
      });

      const documents = toDocument<TransactionDocument[]>(response.rows);
      allTransactions.push(
        ...documents.map((doc) => TransactionMapper.toDomain(doc)),
      );

      if (documents.length < Math.min(100, remaining)) {
        hasMore = false;
      } else {
        offset += documents.length;
      }
    }

    return allTransactions;
  }

  /**
   * Deletes a transaction by its ID (hard delete/undo).
   * @param id - The transaction UUID.
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    await this.ensureSession();
    try {
      await this.tablesDb.deleteRow({
        databaseId: this.databaseId,
        tableId: this.transactionsCollectionId,
        rowId: id,
      });
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        return; // Already deleted
      }
      console.error("AppwriteTransactionRepository.delete error:", error);
      throw error;
    }
  }
}
