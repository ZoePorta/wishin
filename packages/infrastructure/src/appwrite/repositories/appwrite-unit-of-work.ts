import type { UnitOfWork } from "@wishin/domain";

/**
 * Appwrite implementation of UnitOfWork.
 *
 * NOTE: Appwrite does not currently support multi-document or multi-collection transactions
 * in the client/server Node SDK. This implementation provides a structural hook
 * for coordinating multiple repository calls. While it doesn't offer true ACID
 * atomicity at the database level, it allows the application layer to treat
 * operations as a single unit or move to Cloud Functions in the future for better atomicity.
 */
export class AppwriteUnitOfWork implements UnitOfWork {
  /**
   * Executes the provided work.
   *
   * @param work - The asynchronous function containing business logic.
   * @returns {Promise<T>} The result of the work.
   */
  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    // Current Appwrite limitation: No true transaction support in SDK.
    // We execute the work and let exceptions bubble up.
    // Future enhancement: Use Appwrite Executions (Cloud Functions) for ACID properties.
    return await work();
  }
}
