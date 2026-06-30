import type {
  AuthenticatedAuthResult,
  AnonymousAuthResult,
} from "../use-cases/dtos/auth.dto";

/**
 * Repository interface for Authentication operations.
 * Handles user identity, session management, and credential verification.
 */
export interface AuthRepository {
  /**
   * Registers a new user with email and password.
   * @param email The user's email address.
   * @param password The user's password.
   * @param username The user's display name or username.
   * @returns A Promise that resolves to the authentication result.
   * @throws {Error} If registration fails.
   */
  register(
    email: string,
    password: string,
    username: string,
  ): Promise<AuthenticatedAuthResult>;

  /**
   * Logs in a user with email and password.
   * @param email The user's email address.
   * @param password The user's password.
   * @returns A Promise that resolves to the authentication result.
   * @throws {Error} If login fails.
   */
  login(email: string, password: string): Promise<AuthenticatedAuthResult>;

  /**
   * Generates the URL to initiate Google OAuth2 flow.
   * @returns A Promise that resolves to the OAuth initiation URL.
   * @throws {Error} If failure to build the URL or other runtime errors occur.
   */
  getGoogleOAuthUrl(): Promise<string>;

  /**
   * Completes the Google OAuth2 flow using the callback URL.
   * @param callbackUrl The full URL received from the OAuth2 redirect.
   * @returns A Promise that resolves to the authentication result.
   * @throws {Error} If flow completion fails.
   */
  completeGoogleOAuth(callbackUrl: string): Promise<AuthenticatedAuthResult>;

  /**
   * Logs out the current user session.
   * @returns A Promise that resolves when the logout is complete.
   * @throws {Error} If logout fails.
   */
  logout(): Promise<void>;

  /**
   * Performs a best-effort cleanup of authentication data after a failed registration.
   *
   * @note Appwrite implementation may preserve the account to support the "Incomplete Account" strategy.
   *
   * @param userId - The unique identifier of the user to clean up.
   * @returns A Promise that resolves when the cleanup attempt is complete.
   */
  cleanupAuthAfterFailedRegistration(userId: string): Promise<void>;

  /**
   * Explicitly starts an anonymous session.
   * @returns A Promise that resolves to the authentication result (anonymous userId, with no email).
   * @throws {Error} If session creation fails.
   */
  loginAnonymously(): Promise<AnonymousAuthResult>;
}
