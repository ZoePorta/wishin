import {
  Client,
  Account,
  ID,
  OAuthProvider,
  AppwriteException,
} from "appwrite";
import type { AuthRepository, OAuthInitiation } from "@wishin/domain";
import type { AuthResult, Logger } from "@wishin/domain";

/**
 * Appwrite implementation of the AuthRepository.
 */
export class AppwriteAuthRepository implements AuthRepository {
  private readonly account: Account;

  /**
   * Initializes the repository with an Appwrite Client and a Logger.
   * @param client - The Appwrite Client SDK instance.
   * @param logger - The domain logger for infrastructure events.
   */
  constructor(
    private readonly client: Client,
    private readonly logger: Logger,
  ) {
    this.account = new Account(this.client);
  }

  /**
   * Registers a new user with email and password.
   * Supports promoting an existing anonymous session if active.
   *
   * @param email - The user's email address.
   * @param password - The user's password.
   * @returns A Promise that resolves to the authentication result.
   * @throws {AppwriteException} If user creation or promotion fails.
   */
  async register(email: string, password: string): Promise<AuthResult> {
    let isAnonymous = false;
    let userId: string = ID.unique();
    try {
      // Check if there is an active anonymous session to promote (ADR 018)
      const currentUser = await this.account.get();
      isAnonymous = !currentUser.email;
      if (isAnonymous) {
        userId = currentUser.$id;
      }
    } catch (error: unknown) {
      // 401 (Unauthorized) means there is no active session, which is fine.
      // We re-throw any other error (network, server error) to avoid silent failures.
      if (error instanceof AppwriteException && error.code !== 401) {
        throw error;
      }

      if (!(error instanceof AppwriteException)) {
        throw error;
      }
    }

    // The official Appwrite way to promote an anonymous user is to call account.create
    // while the session is active. It converts the account and preserves the userId.
    const user = await this.account.create({
      userId,
      email,
      password,
    });

    return {
      userId: user.$id,
      email: user.email,
      isNewUser: !isAnonymous,
    };
  }

  /**
   * Logs in a user with email and password.
   *
   * @param email - The user's email address.
   * @param password - The user's password.
   * @returns A Promise that resolves to the authentication result.
   * @throws {AppwriteException} If session creation or account retrieval fails.
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
      isNewUser: false,
    };
  }

  /**
   * Generates the URL and state to initiate Google OAuth2 flow using the Account service.
   * @returns A Promise that resolves to the OAuth initiation metadata.
   */
  async getGoogleOAuthUrl(): Promise<OAuthInitiation> {
    const oauthUrl = this.account.createOAuth2Token({
      provider: OAuthProvider.Google,
    });

    if (!oauthUrl) {
      throw new Error("Failed to generate Google OAuth2 URL");
    }

    // Note: Appwrite's client-side createOAuth2Token handle state internally via redirect
    // but the domain contract now requires it. For now, we return a placeholder
    // if the underlying SDK doesn't expose it, or we would generate it if we were
    // managing the full server-side flow.
    return {
      url: oauthUrl,
      state: "appwrite-internal", // Appwrite manages the nonce in the URL internally
    };
  }

  /**
   * Completes the Google OAuth2 flow using the callback URL parameters.
   * @param callbackUrl The full URL received from the OAuth2 redirect.
   * @param _expectedState The expected state to verify (currently ignored as Appwrite handles it).
   * @returns A Promise that resolves to the authentication result.
   */
  async completeGoogleOAuth(
    callbackUrl: string,
    _expectedState: string,
  ): Promise<AuthResult> {
    const url = new URL(callbackUrl);
    const userId = url.searchParams.get("userId");
    const secret = url.searchParams.get("secret");

    if (!userId || !secret) {
      throw new Error("Invalid OAuth2 callback: missing userId or secret");
    }

    await this.account.createSession({ userId, secret });
    const user = await this.account.get();
    return {
      userId: user.$id,
      email: user.email,
      isNewUser: false,
    };
  }

  /**
   * Logs out the current user session.
   *
   * @returns A Promise that resolves when the logout is complete.
   * @throws {AppwriteException} If session deletion fails.
   */
  async logout(): Promise<void> {
    await this.account.deleteSession({
      sessionId: "current",
    });
  }

  /**
   * Logs an intended user deletion attempt.
   *
   * @note This method is intentionally a noop to support the "Incomplete Account" strategy.
   * Auth accounts are preserved to avoid data loss during profile creation failures.
   *
   * @param userId - The unique identifier of the user.
   * @returns A Promise that resolves immediately.
   */
  async deleteUser(userId: string): Promise<void> {
    // Note: The Client SDK Account service does not have a delete method for users.
    // To support "Incomplete Accounts", we avoid deletion and instead rely on UI-driven recovery.
    // We log the attempt for observability as requested, redacting the full userId.
    this.logger.warn(
      `deleteUser suppressed for user [REDACTED]. "Incomplete Account" strategy active: Auth account is preserved even if profile fails.`,
      { userIdObfuscated: userId.substring(0, 4) + "****" },
    );
  }
}
