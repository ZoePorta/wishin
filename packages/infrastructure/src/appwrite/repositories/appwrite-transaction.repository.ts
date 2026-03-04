import {
  Client,
  Account,
  TablesDB,
  Query,
  AppwriteException,
  type Models,
} from "appwrite";
import { TransactionStatus, PersistenceError } from "@wishin/domain";
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

  private ensureSessionInFlight: Promise<void> | null = null;
  private sessionEnsured = false;
  private _currentUser: Models.User<Models.Preferences> | null = null;

  /**
   * Ensures an active session exists.
   * Creates an anonymous session if no session is active.
   *
   * @returns {Promise<Models.User<Models.Preferences>>} The current user model.
   * @throws {PersistenceError} If the session cannot be ensured.
   */
  async ensureSession(): Promise<Models.User<Models.Preferences>> {
    if (this.sessionEnsured && this._currentUser) {
      return this._currentUser;
    }

    if (this.ensureSessionInFlight) {
      await this.ensureSessionInFlight;
      if (this._currentUser) return this._currentUser;
    }

    this.ensureSessionInFlight = (async () => {
      try {
        this._currentUser = await this.account.get();
        this.sessionEnsured = true;
      } catch (error: unknown) {
        // More robust check for code 401 to handle monorepo instanceof issues
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === 401
        ) {
          try {
            await this.account.createAnonymousSession();
            this._currentUser = await this.account.get();
            this.sessionEnsured = true;
          } catch (sessionError: unknown) {
            throw new PersistenceError("Failed to create anonymous session", {
              cause: sessionError,
            });
          }
        } else {
          throw new PersistenceError("Failed to get current account", {
            cause: error,
          });
        }
      }
    })();

    try {
      await this.ensureSessionInFlight;
    } finally {
      this.ensureSessionInFlight = null;
    }

    if (!this._currentUser) {
      throw new PersistenceError("Session initialization failed: user is null");
    }

    return this._currentUser;
  }

  /**
   * Retrieves the current user's unique identifier.
   * @returns A Promise that resolves to the current user ID.
   * @throws {PersistenceError} If the account cannot be retrieved.
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
   * @throws {PersistenceError} If the upsert fails.
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
      throw new PersistenceError("Failed to save transaction", {
        cause: error,
      });
    }
  }

  /**
   * Finds a transaction by its unique ID.
   *
   * @param id - The transaction UUID.
   * @returns {Promise<Transaction | null>}
   * @throws {PersistenceError} If the retrieval fails.
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
      throw new PersistenceError("Failed to find transaction by ID", {
        cause: error,
      });
    }
  }

  /**
   * Finds all transactions associated with a specific wishlist item.
   * @param itemId - The item UUID.
   * @returns {Promise<Transaction[]>}
   * @throws {PersistenceError} If the query fails.
   */
  async findByItemId(itemId: string): Promise<Transaction[]> {
    await this.ensureSession();
    try {
      const response = await this.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: this.transactionsCollectionId,
        queries: [Query.equal("itemId", itemId), Query.limit(100)],
      });

      const documents = toDocument<Models.Document[]>(response.rows);
      return documents.map((doc) => TransactionMapper.toDomain(doc));
    } catch (error) {
      throw new PersistenceError("Failed to find transactions by item ID", {
        cause: error,
      });
    }
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
   * @throws {PersistenceError} If the cancellation operation fails.
   */
  async cancelByItemId(itemId: string): Promise<number> {
    await this.ensureSession();
    let totalCancelled = 0;
    let hasMore = true;

    try {
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
        if (docs.length < 100) {
          hasMore = false;
        }
      }
    } catch (error) {
      throw new PersistenceError("Failed to cancel transactions by item ID", {
        cause: error,
      });
    }

    return totalCancelled;
  }

  /**
   * Finds all transactions for a specific user.
   * @param userId - The user identity.
   * @param status - Optional filter by transaction status.
   * @param limit - Optional maximum number of transactions to return (default: no limit).
   * @returns {Promise<Transaction[]>}
   * @throws {PersistenceError} If the query fails.
   */
  async findByUserId(
    userId?: string,
    status?: TransactionStatus,
    limit?: number,
  ): Promise<Transaction[]> {
    const authenticatedUser = await this.ensureSession();
    const targetUserId = userId ?? authenticatedUser.$id;

    if (userId !== undefined && userId !== authenticatedUser.$id) {
      throw new PersistenceError(
        "Unauthorized access: userId does not match authenticated user",
      );
    }

    const allTransactions: Transaction[] = [];
    let hasMore = true;
    let offset = 0;

    try {
      while (hasMore) {
        let fetchLimit = 100;

        if (limit !== undefined) {
          const remaining = limit - allTransactions.length;
          if (remaining <= 0) {
            hasMore = false;
            break;
          }
          fetchLimit = Math.min(100, remaining);
        }

        const queries = [
          Query.equal("userId", targetUserId),
          Query.limit(fetchLimit),
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

        if (documents.length < fetchLimit) {
          hasMore = false;
        } else {
          offset += documents.length;
        }
      }
    } catch (error) {
      if (error instanceof PersistenceError) throw error;
      throw new PersistenceError("Failed to find transactions by user ID", {
        cause: error,
      });
    }

    return allTransactions;
  }

  /**
   * Deletes a transaction by its ID (hard delete/undo).
   * @param id - The transaction UUID.
   * @returns {Promise<void>}
   * @throws {PersistenceError} If the deletion fails.
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
      throw new PersistenceError("Failed to delete transaction", {
        cause: error,
      });
    }
  }
}
