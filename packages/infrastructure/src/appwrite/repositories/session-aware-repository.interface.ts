import type { Models } from "appwrite";

/**
 * Interface representing a repository that requires active sessions.
 * This is used to separate session management concerns from the domain layer.
 */
export interface SessionAwareRepository {
  /**
   * Resolves the current active session.
   * Returns null if no session is active.
   * @returns A Promise that resolves to the session/user object if it exists, otherwise null.
   * @throws {PersistenceError} If the session check fails unexpectedly.
   */
  resolveSession(): Promise<Models.User<Models.Preferences> | null>;

  /**
   * Retrieves the current user's unique identifier.
   * @returns A Promise that resolves to the current user ID, or null if no session active.
   */
  getCurrentUserId(): Promise<string | null>;
}
