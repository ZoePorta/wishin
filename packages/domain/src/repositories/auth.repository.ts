import type { AuthResult } from "../use-cases/dtos/auth.dto";

/**
 * Repository interface for Authentication operations.
 * Handles user identity, session management, and credential verification.
 */
export interface AuthRepository {
  /**
   * Registers a new user with email and password.
   * @param email The user's email address.
   * @param password The user's password.
   * @returns A Promise that resolves to the authentication result.
   * @throws {Error} If registration fails.
   */
  register(email: string, password: string): Promise<AuthResult>;

  /**
   * Logs in a user with email and password.
   * @param email The user's email address.
   * @param password The user's password.
   * @returns A Promise that resolves to the authentication result.
   * @throws {Error} If login fails.
   */
  login(email: string, password: string): Promise<AuthResult>;

  /**
   * Initiates a login flow with Google OAuth2.
   * @returns A Promise that resolves to the OAuth2 redirection URL.
   * @throws {Error} If the flow cannot be initiated.
   */
  loginWithGoogle(): Promise<string>;

  /**
   * Logs out the current user session.
   * @returns A Promise that resolves when the logout is complete.
   * @throws {Error} If logout fails.
   */
  logout(): Promise<void>;

  /**
   * Deletes a user by their ID.
   * Used for cleanup during failed registration flows.
   * @param userId - The unique identifier of the user to delete.
   * @returns A Promise that resolves when the user is deleted.
   * @throws {Error} If deletion fails.
   */
  deleteUser(userId: string): Promise<void>;
}
