import type { Models } from "react-native-appwrite";

/**
 * Interface representing a repository that requires active sessions.
 * This is used to separate session management concerns from the domain layer.
 */
export interface SessionAwareRepository {
  /**
   * Resolves the current active session.
   *
   * @returns A Promise that resolves to the current user for the active session (Models.User<Models.Preferences>),
   * or null if no session is active.
   * @throws {PersistenceError} If the session check fails due to unexpected errors (e.g., network failure).
   */
  resolveSession(): Promise<Models.User<Models.Preferences> | null>;

  /**
   * Retrieves the current user's unique identifier.
   * @returns A Promise that resolves to the current user ID, or null if no session active.
   */
  getCurrentUserId(): Promise<string | null>;
}
