import type { Transaction } from "../aggregates/transaction";

/**
 * Repository interface for Transaction aggregates.
 */
export interface TransactionRepository {
  /**
   * Persists a transaction aggregate.
   * @param transaction - The transaction to save.
   */
  save(transaction: Transaction): Promise<void>;

  /**
   * Finds a transaction by its unique ID.
   * @param id - The transaction UUID.
   */
  findById(id: string): Promise<Transaction | null>;

  /**
   * Finds all transactions associated with a specific wishlist item.
   * @param itemId - The item UUID.
   */
  findByItemId(itemId: string): Promise<Transaction[]>;
}
