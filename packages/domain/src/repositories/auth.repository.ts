import type { AuthResult } from "../use-cases/dtos/auth.dto";

/**
 * Repository interface for Authentication operations.
 * Wraps Appwrite Account service.
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
   * @returns A Promise that resolves when the flow is initiated.
   * @throws {Error} If the flow cannot be initiated.
   */
  loginWithGoogle(): Promise<void>;

  /**
   * Logs out the current user session.
   * @returns A Promise that resolves when the logout is complete.
   */
  logout(): Promise<void>;
}
