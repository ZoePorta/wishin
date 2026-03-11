/**
 * Repository interface for User/Session operations.
 * Decouples identity management from domain-specific repositories.
 */
export interface UserRepository {
  /**
   * Retrieves the current user's unique identifier.
   * @returns A Promise that resolves to the current user ID.
   */
  getCurrentUserId(): Promise<string>;

  /**
   * Determines the current session type to distinguish between guests and members.
   * @returns A Promise that resolves to the session type:
   * - 'anonymous': Guest user with no registered account.
   * - 'incomplete': Registered account but missing profile record.
   * - 'registered': Fully registered user with a profile.
   */
  getSessionType(): Promise<"anonymous" | "incomplete" | "registered">;
}
