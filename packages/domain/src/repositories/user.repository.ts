/**
 * Repository interface for User/Session operations.
 * Decouples identity management from domain-specific repositories.
 */
export interface UserRepository {
  /**
   * Retrieves the current user's unique identifier.
   * @returns A Promise that resolves to the current user ID, or null if no session is active.
   */
  getCurrentUserId(): Promise<string | null>;
}
