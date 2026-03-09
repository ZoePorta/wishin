import { Client, Account, ID, OAuthProvider } from "appwrite";
import type { AuthRepository } from "@wishin/domain";
import type { AuthResult } from "@wishin/domain";

/**
 * Appwrite implementation of the AuthRepository.
 */
export class AppwriteAuthRepository implements AuthRepository {
  private readonly account: Account;

  constructor(private readonly client: Client) {
    this.account = new Account(this.client);
  }

  /**
   * Registers a new user with email and password.
   *
   * @param email - The user's email address.
   * @param password - The user's password.
   * @returns A Promise that resolves to the authentication result.
   */
  async register(email: string, password: string): Promise<AuthResult> {
    const user = await this.account.create({
      userId: ID.unique(),
      email,
      password,
    });
    return {
      userId: user.$id,
      email: user.email,
    };
  }

  /**
   * Logs in a user with email and password.
   *
   * @param email - The user's email address.
   * @param password - The user's password.
   * @returns A Promise that resolves to the authentication result.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    await this.account.createEmailPasswordSession({
      email,
      password,
    });
    const user = await this.account.get();
    return {
      userId: user.$id,
      email: user.email,
    };
  }

  /**
   * Initiates a login flow with Google OAuth2.
   *
   * @returns A Promise that resolves when the flow is initiated.
   */
  async loginWithGoogle(): Promise<void> {
    // Note: redirection handling is expected to be managed by the caller/platform
    this.account.createOAuth2Session({
      provider: OAuthProvider.Google,
    });
  }

  /**
   * Logs out the current user session.
   *
   * @returns A Promise that resolves when the logout is complete.
   */
  async logout(): Promise<void> {
    await this.account.deleteSession({
      sessionId: "current",
    });
  }
}
