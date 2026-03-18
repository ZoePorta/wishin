import {
  Client,
  Account,
  TablesDB,
  Query,
  AppwriteException,
  type Models,
} from "appwrite";
import {
  TransactionStatus,
  PersistenceError,
  type TransactionRepository,
  type Transaction,
} from "@wishin/domain";
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

  private resolveSessionInFlight: Promise<Models.User<Models.Preferences> | null> | null =
    null;
  private _currentUser: Models.User<Models.Preferences> | null = null;

  /**
   * Resolves the current session state.
   *
   * @remarks
   * This method does not create a session if one does not exist; it only retrieves
   * the current state from Appwrite.
   *
   * @returns A Promise that resolves to the user object if a session is active, or null if no session exists.
   * @throws {PersistenceError} If the session resolution fails due to a network or server error.
   */
  async resolveSession(): Promise<Models.User<Models.Preferences> | null> {
    if (this.resolveSessionInFlight) {
      return this.resolveSessionInFlight;
    }

    this.resolveSessionInFlight = (async () => {
      try {
        this._currentUser = await this.account.get();
        return this._currentUser;
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === 401
        ) {
          this._currentUser = null;
          return null;
        }
        throw new PersistenceError("Failed to get current account", {
          cause: error instanceof Error ? error : String(error),
        });
      } finally {
        this.resolveSessionInFlight = null;
      }
    })();

    return this.resolveSessionInFlight;
  }

  /**
   * Retrieves the current user's unique identifier.
   *
   * @remarks
   * This method only returns the ID for an existing session and does not create one.
   *
   * @returns A Promise that resolves to the current user ID as a string, or null if no active session exists.
   * @throws {PersistenceError} If the account cannot be retrieved due to a system error.
   */
  async getCurrentUserId(): Promise<string | null> {
    const session = await this.resolveSession();
    return session?.$id ?? null;
  }

  /**
   * Persists a transaction aggregate.
   *
   * @param transaction - The transaction to save.
   * @returns {Promise<void>}
   * @throws {PersistenceError} If the upsert fails.
   */
  async save(transaction: Transaction): Promise<void> {
    // Ensure session exists to have an identity to act
    const session = await this.resolveSession();
    if (!session) {
      throw new PersistenceError(
        "Unauthorized: No active session for saving transaction",
      );
    }
    try {
      await this.tablesDb.upsertRow({
        databaseId: this.databaseId,
        tableId: this.transactionsCollectionId,
        rowId: transaction.id,
        data: TransactionMapper.toPersistence(transaction),
      });
    } catch (error) {
      throw new PersistenceError("Failed to save transaction", {
        cause: error instanceof Error ? error : String(error),
      });
    }
  }

  /**
   * Finds a transaction by its unique ID.
   *
   * @param id - The transaction UUID.
   * @returns A Promise that resolves to the Transaction aggregate or null if not found.
   * @throws {PersistenceError} If the query fails or session cannot be ensured.
   */
  async findById(id: string): Promise<Transaction | null> {
    await this.resolveSession();
    try {
      const response = await this.tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: this.transactionsCollectionId,
        rowId: id,
      });

      return TransactionMapper.toDomain(
        toDocument<TransactionDocument>(response),
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 404
      ) {
        return null;
      }
      throw new PersistenceError("Failed to find transaction by ID", {
        cause: error instanceof Error ? error : String(error),
      });
    }
  }

  /**
   * Finds all transactions for a specific item.
   *
   * @param itemId - The item UUID.
   * @returns A Promise that resolves to an array of Transaction aggregates.
   * @throws {PersistenceError} If the query fails or session cannot be ensured.
   */
  async findByItemId(itemId: string): Promise<Transaction[]> {
    await this.resolveSession();
    try {
      const response = await this.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: this.transactionsCollectionId,
        queries: [Query.equal("itemId", itemId)],
      });

      const docs = toDocument<TransactionDocument[]>(response.rows);
      return docs.map((doc) => TransactionMapper.toDomain(doc));
    } catch (error) {
      throw new PersistenceError("Failed to find transactions by item ID", {
        cause: error instanceof Error ? error : String(error),
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
    const session = await this.resolveSession();
    if (!session) {
      throw new PersistenceError(
        "Unauthorized: No active session for cancelling transactions",
      );
    }
    let totalCancelled = 0;
    let hasMore = true;
    let cursor: string | undefined;

    const processedIds = new Set<string>();
    try {
      while (hasMore) {
        // 1. Fetch a page of RESERVED transactions for the item
        const queries = [
          Query.equal("itemId", itemId),
          Query.equal("status", TransactionStatus.RESERVED),
          Query.limit(100),
        ];

        if (cursor) {
          queries.push(Query.cursorAfter(cursor));
        }

        const response = await this.tablesDb.listRows({
          databaseId: this.databaseId,
          tableId: this.transactionsCollectionId,
          queries,
        });

        const docs = toDocument<TransactionDocument[]>(response.rows);

        // Filter out those already processed in this call (handles stale index cases)
        const newDocs = docs.filter((doc) => !processedIds.has(doc.$id));

        if (newDocs.length > 0) {
          // 2. Transition this page to CANCELLED_BY_OWNER
          const updates = newDocs.map((doc) => {
            processedIds.add(doc.$id);
            return this.tablesDb.updateRow({
              databaseId: this.databaseId,
              tableId: this.transactionsCollectionId,
              rowId: doc.$id,
              data: {
                status: TransactionStatus.CANCELLED_BY_OWNER,
              },
            });
          });

          await Promise.all(updates);
          totalCancelled += newDocs.length;
        }

        // Advance the cursor to the last document seen in this page
        if (docs.length < 100) {
          hasMore = false;
        } else {
          cursor = docs[docs.length - 1].$id;
        }
      }
    } catch (error) {
      throw new PersistenceError("Failed to cancel transactions by item ID", {
        cause: error instanceof Error ? error : String(error),
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
   * @throws {PersistenceError} If the query fails or authorization is denied.
   */
  async findByUserId(
    userId?: string,
    status?: TransactionStatus,
    limit?: number,
  ): Promise<Transaction[]> {
    const authenticatedUser = await this.resolveSession();

    if (!authenticatedUser) {
      if (userId !== undefined) {
        throw new PersistenceError(
          "Unauthorized access: no active session for requested user",
        );
      }
      return [];
    }
    const targetUserId = userId ?? authenticatedUser.$id;

    if (userId !== undefined && userId !== authenticatedUser.$id) {
      throw new PersistenceError(
        "Unauthorized access: userId does not match authenticated user",
      );
    }

    if (limit === 0) {
      return [];
    }

    const sanitizedLimit =
      limit !== undefined ? Math.max(0, Math.floor(limit || 0)) : undefined;

    if (sanitizedLimit === 0) {
      return [];
    }

    const allTransactions: Transaction[] = [];
    let hasMore = true;
    let offset = 0;

    try {
      while (hasMore) {
        let fetchLimit = 100;

        if (sanitizedLimit !== undefined) {
          const remaining = sanitizedLimit - allTransactions.length;
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
        cause: error instanceof Error ? error : String(error),
      });
    }

    return allTransactions;
  }
  /**
   * Finds transactions for a specific user and item, filtered by status.
   * @param userId - The user identity.
   * @param itemId - The item UUID.
   * @param status - Optional filter by transaction status.
   * @returns {Promise<Transaction[]>}
   * @throws {PersistenceError} If the query fails or session cannot be ensured.
   */
  async findByUserIdAndItemId(
    userId: string,
    itemId: string,
    status?: TransactionStatus,
  ): Promise<Transaction[]> {
    const authenticatedUser = await this.resolveSession();

    if (userId !== authenticatedUser?.$id) {
      throw new PersistenceError(
        "Unauthorized access: userId does not match authenticated user",
      );
    }
    try {
      const queries = [
        Query.equal("userId", userId),
        Query.equal("itemId", itemId),
      ];

      if (status) {
        queries.push(Query.equal("status", status));
      }

      const response = await this.tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: this.transactionsCollectionId,
        queries,
      });

      const docs = toDocument<TransactionDocument[]>(response.rows);
      return docs.map((doc) => TransactionMapper.toDomain(doc));
    } catch (error) {
      throw new PersistenceError(
        "Failed to find transactions by user ID and item ID",
        {
          cause: error instanceof Error ? error : String(error),
        },
      );
    }
  }

  /**
   * Deletes a transaction by its ID (hard delete/undo).
   * @param id - The transaction UUID.
   * @returns {Promise<void>}
   * @throws {PersistenceError} If the deletion fails or session cannot be ensured.
   */
  async delete(id: string): Promise<void> {
    const session = await this.resolveSession();
    if (!session) {
      throw new PersistenceError(
        "Unauthorized: No active session for deleting transaction",
      );
    }
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
        cause: error instanceof Error ? error : String(error),
      });
    }
  }
}
