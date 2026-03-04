import type { Models } from "appwrite";

/**
 * Interface representing a repository that requires active sessions.
 * This is used to separate session management concerns from the domain layer.
 */
export interface SessionAwareRepository {
  /**
   * Ensures an active session exists.
   * Creates an anonymous session if no session is active.
   * @returns A Promise that resolves to the session/user object when a session is ensured.
   */
  ensureSession(): Promise<Models.User<Models.Preferences>>;

  /**
   * Retrieves the current user's unique identifier.
   * @returns A Promise that resolves to the current user ID.
   */
  getCurrentUserId(): Promise<string>;
}
