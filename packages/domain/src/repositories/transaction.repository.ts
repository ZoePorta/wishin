import type { Transaction } from "../aggregates/transaction";
import type { TransactionStatus } from "../value-objects/transaction-status";

/**
 * Repository interface for Transaction aggregates.
 */
export interface TransactionRepository {
  /**
   * Persists a transaction aggregate.
   * @param transaction - The transaction to save.
   * @returns {Promise<void>}
   */
  save(transaction: Transaction): Promise<void>;

  /**
   * Finds a transaction by its unique ID.
   * @param id - The transaction UUID.
   * @returns {Promise<Transaction | null>}
   */
  findById(id: string): Promise<Transaction | null>;

  /**
   * Finds all transactions associated with a specific wishlist item.
   * @param itemId - The item UUID.
   * @returns {Promise<Transaction[]>}
   */
  findByItemId(itemId: string): Promise<Transaction[]>;

  /**
   * Atomically transitions all RESERVED transactions for an item to CANCELLED_BY_OWNER.
   * @param itemId - The item UUID.
   * @returns {Promise<number>} The number of transactions cancelled.
   */
  cancelByItemId(itemId: string): Promise<number>;

  /**
   * Finds all transactions for a specific user.
   * @param userId - The user identity.
   * @param status - Optional filter by transaction status.
   * @param limit - Optional maximum number of transactions to return.
   * @returns {Promise<Transaction[]>}
   * @throws {PersistenceError} If there is an error accessing the data store.
   */
  findByUserId(
    userId: string,
    status?: TransactionStatus,
    limit?: number,
  ): Promise<Transaction[]>;

  /**
   * Deletes a transaction by its ID (hard delete/undo).
   * This operation is idempotent; it returns success if the transaction doesn't exist.
   * @param id - The transaction UUID.
   * @returns {Promise<void>}
   * @throws {PersistenceError} If the deletion fails due to an underlying infrastructure error.
   */
  delete(id: string): Promise<void>;
}
