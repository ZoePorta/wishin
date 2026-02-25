import type { Transaction } from "../aggregates/transaction";

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
}
