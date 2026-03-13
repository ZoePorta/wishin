import {
  Client,
  Account,
  ID,
  OAuthProvider,
  AppwriteException,
} from "appwrite";
import type { AuthRepository, OAuthInitiation } from "@wishin/domain";
import type {
  AuthenticatedAuthResult,
  AnonymousAuthResult,
  Logger,
} from "@wishin/domain";

/**
 * Appwrite implementation of the AuthRepository.
 */
export class AppwriteAuthRepository implements AuthRepository {
  private readonly account: Account;
  private readonly oauthStates: Map<string, { timestamp: number }> = new Map<
    string,
    { timestamp: number }
  >();
  private static readonly STATE_TTL = 10 * 60 * 1000; // 10 minutes

  /**
   * Initializes the repository with an Appwrite Client and a Logger.
   * @param client - The Appwrite Client SDK instance.
   * @param endpoint - The Appwrite API endpoint.
   * @param projectId - The Appwrite Project ID.
   * @param logger - The domain logger for infrastructure events.
   */
  constructor(
    private readonly client: Client,
    private readonly endpoint: string,
    private readonly projectId: string,
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
   * @param username - The display or account username.
   * @returns A Promise that resolves to the authentication result.
   * @throws {AppwriteException} If user creation or promotion fails.
   */
  async register(
    email: string,
    password: string,
    username: string,
  ): Promise<AuthenticatedAuthResult> {
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

    // The official Appwrite way to promote an anonymous user is to call updateEmail
    // while the session is active. It converts the account and preserves the userId.
    let user;
    if (isAnonymous) {
      user = await this.account.updateEmail({
        email,
        password,
      });
      // Update name after promotion
      await this.account.updateName({ name: username });
    } else {
      user = await this.account.create({
        userId,
        email,
        password,
        name: username,
      });
    }

    return {
      type: "authenticated",
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
  async login(
    email: string,
    password: string,
  ): Promise<AuthenticatedAuthResult> {
    // 1. Check current session state (ADR 027)
    let priorSessionIsAnonymous = false;
    try {
      const user = await this.account.get();
      priorSessionIsAnonymous = !user.email;
      if (user.email === email) {
        // Already logged in as the correct user
        return {
          type: "authenticated",
          userId: user.$id,
          email: user.email,
          isNewUser: false,
        };
      }
    } catch {
      // No active session, safe to proceed
    }

    // 2. Validate credentials with a "probe" client
    const probeClient = new Client()
      .setEndpoint(this.endpoint)
      .setProject(this.projectId);
    const probeAccount = new Account(probeClient);

    try {
      await probeAccount.createEmailPasswordSession({
        email,
        password,
      });
    } catch (error: unknown) {
      // If validation fails, and we had an anonymous session, ensure it's still there
      if (priorSessionIsAnonymous) {
        try {
          const current = await this.account.get();

          if (current.email) {
            await this.account.createAnonymousSession();
          }
        } catch {
          await this.account.createAnonymousSession().catch(() => null);
        }
      }
      throw error;
    }

    // 3. Ensure the main account instance is logged in
    try {
      const user = await this.account.get();
      if (user.email === email) {
        return {
          type: "authenticated",
          userId: user.$id,
          email: user.email,
          isNewUser: false,
        };
      }
      // Different user or guest, switch
      await this.account.deleteSession({ sessionId: "current" });
    } catch {
      // No session
    }

    await this.account.createEmailPasswordSession({
      email,
      password,
    });

    const user = await this.account.get();

    return {
      type: "authenticated",
      userId: user.$id,
      email: user.email,
      isNewUser: false,
    };
  }

  /**
   * Generates the URL and state to initiate Google OAuth2 flow using the Account service.
   * @returns A Promise that resolves to the OAuth initiation metadata.
   * @throws {Error} If the Google OAuth2 URL generation fails.
   * @throws {Error} If the generated URL is missing the state parameter.
   */
  async getGoogleOAuthUrl(): Promise<OAuthInitiation> {
    const oauthUrl = this.account.createOAuth2Token({
      provider: OAuthProvider.Google,
    });

    if (!oauthUrl) {
      throw new Error("Failed to generate Google OAuth2 URL");
    }

    const url = new URL(oauthUrl);
    const state = url.searchParams.get("state");

    if (!state) {
      throw new Error("Appwrite OAuth URL missing state parameter");
    }

    this.cleanupExpiredStates();
    this.oauthStates.set(state, { timestamp: Date.now() });

    // Appwrite's createOAuth2Token handles redirection, but we return the URL and state
    // so the caller can track it according to the AuthRepository contract.
    return {
      url: oauthUrl,
      state,
    };
  }

  /**
   * Completes the Google OAuth2 flow using the callback URL parameters.
   *
   * @param callbackUrl - The full URL received from the OAuth2 redirect.
   * @param expectedState - The expected state to verify for CSRF protection.
   * @returns A Promise that resolves to the authentication result.
   * @throws {Error} If the state parameter is missing or does not match the expected state.
   * @throws {Error} If the callback URL is missing the userId or secret.
   * @throws {AppwriteException} If session creation or account retrieval fails.
   */
  async completeGoogleOAuth(
    callbackUrl: string,
    expectedState: string,
  ): Promise<AuthenticatedAuthResult> {
    // 1. Cleanup expired states
    this.cleanupExpiredStates();

    const url = new URL(callbackUrl);
    const parsedState = url.searchParams.get("state");

    // 2. Validate state
    if (!parsedState || parsedState !== expectedState) {
      throw new Error("Mismatched OAuth state: possible CSRF attempt");
    }

    // 3. Best-effort cache check
    if (!this.oauthStates.has(parsedState)) {
      this.logger.warn(
        "OAuth state missing from local cache. Proceeding with caller-provided expectedState as source of truth.",
        { hasCacheHit: false },
      );
    } else {
      this.oauthStates.delete(parsedState);
    }

    const userId = url.searchParams.get("userId");
    const secret = url.searchParams.get("secret");

    if (!userId || !secret) {
      throw new Error("Invalid OAuth2 callback: missing userId or secret");
    }

    try {
      await this.account.createSession({ userId, secret });
    } catch (error: unknown) {
      if (error instanceof AppwriteException && error.code === 401) {
        this.logger.error(
          "OAuth session creation failed with 401. Clearing potentially inconsistent local session state.",
          { userId, errorDetails: error.message },
        );
        await this.logout().catch(() => null);
        throw error;
      }
      throw error;
    }

    const user = await this.account.get();
    return {
      type: "authenticated",
      userId: user.$id,
      email: user.email,
      isNewUser: undefined,
    };
  }

  /**
   * Cleans up expired OAuth states from the memory cache to prevent leakage.
   *
   * @private
   */
  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, meta] of this.oauthStates.entries()) {
      if (now - meta.timestamp > AppwriteAuthRepository.STATE_TTL) {
        this.oauthStates.delete(state);
      }
    }
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
   * Logs an intended user cleanup attempt after a failed registration.
   *
   * @note This method is intentionally a noop or log-only to support the "Incomplete Account" strategy.
   * Auth accounts are preserved to avoid data loss during profile creation failures.
   *
   * @param userId - The unique identifier of the user.
   * @returns A Promise that resolves immediately.
   */
  async cleanupAuthAfterFailedRegistration(userId: string): Promise<void> {
    // Note: The Client SDK Account service does not have a delete method for users.
    // To support "Incomplete Accounts", we avoid deletion and instead rely on UI-driven recovery.
    // We log the attempt for observability as requested, redacting the full userId.
    this.logger.warn(
      `cleanupAuthAfterFailedRegistration called for user [REDACTED]. "Incomplete Account" strategy active: Auth account is preserved even if profile fails.`,
      { userIdObfuscated: userId.substring(0, 4) + "****" },
    );
  }

  /**
   * Explicitly starts an anonymous session.
   * @returns A Promise that resolves to the authentication result (anonymous userId).
   * @throws {AppwriteException} If session creation fails.
   */
  async loginAnonymously(): Promise<AnonymousAuthResult> {
    try {
      // Idempotency: check if we already have an anonymous session (ADR 027)
      const user = await this.account.get();
      if (!user.email) {
        return {
          type: "anonymous",
          userId: user.$id,
          isNewUser: false,
        };
      }
      // If already logged in with email, we might want to throw or logout.
      // Per requirements, if they want guest login we should probably logout email session.
      await this.logout();
    } catch (error: unknown) {
      // 401 is expected if no session
      if (!(error instanceof AppwriteException && error.code === 401)) {
        throw error;
      }
    }

    await this.account.createAnonymousSession();
    const user = await this.account.get();
    return {
      type: "anonymous",
      userId: user.$id,
      isNewUser: true,
    };
  }
}
