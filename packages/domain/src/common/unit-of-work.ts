/**
 * Interface for coordinating atomic operations across multiple repositories.
 * Implementation-specific details (transactions, sessions, units of work) are handled by the infrastructure layer.
 */
export interface UnitOfWork {
  /**
   * Executes a block of logic within a single atomic/transactional boundary.
   *
   * @param work - The asynchronous function containing the business logic to execute.
   * @returns The result of the work function.
   * @throws {Error} If the work or the transaction commit fails.
   */
  runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
