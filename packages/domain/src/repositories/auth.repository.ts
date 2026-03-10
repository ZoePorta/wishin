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
   * Generates the URL to initiate Google OAuth2 flow.
   * @returns The OAuth2 provider URL.
   */
  getGoogleOAuthUrl(): string;

  /**
   * Completes the Google OAuth2 flow using the callback URL.
   * @param callbackUrl The full URL received from the OAuth2 redirect.
   * @returns A Promise that resolves to the authentication result.
   * @throws {Error} If flow completion fails.
   */
  completeGoogleOAuth(callbackUrl: string): Promise<AuthResult>;

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
