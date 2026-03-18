import {
  Client,
  Account,
  ID,
  OAuthProvider,
  TablesDB,
  AppwriteException,
  type Models,
} from "appwrite";
import type {
  AuthRepository,
  OAuthInitiation,
  UserRepository,
  Logger,
} from "@wishin/domain";
import type {
  AuthenticatedAuthResult,
  AnonymousAuthResult,
} from "@wishin/domain";
import type { SessionAwareRepository } from "./session-aware-repository.interface";

/**
 * Appwrite implementation of the AuthRepository and UserRepository.
 */
export class AppwriteAuthRepository
  implements AuthRepository, UserRepository, SessionAwareRepository
{
  private readonly account: Account;
  private readonly tablesDb: TablesDB;
  private resolveSessionInFlight: Promise<Models.User<Models.Preferences> | null> | null =
    null;
  private _currentUser: Models.User<Models.Preferences> | null = null;

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
   * @param databaseId - The ID of the Appwrite database.
   * @param profileCollectionId - The ID of the profiles collection.
   * @param logger - The domain logger for infrastructure events.
   */
  constructor(
    private readonly client: Client,
    private readonly endpoint: string,
    private readonly projectId: string,
    private readonly databaseId: string,
    private readonly profileCollectionId: string,
    private readonly logger: Logger,
  ) {
    this.account = new Account(this.client);
    this.tablesDb = new TablesDB(this.client);
  }

  /**
   * Resolves the current session state with memoization.
   *
   * @returns A Promise that resolves to the user object if a session is active, or null otherwise.
   */
  async resolveSession(): Promise<Models.User<Models.Preferences> | null> {
    if (this.resolveSessionInFlight) {
      return this.resolveSessionInFlight;
    }

    this.resolveSessionInFlight = (async () => {
      try {
        this._currentUser = await this.account.get();
        return this._currentUser;
      } catch (error: unknown) {
        if (error instanceof AppwriteException && error.code === 401) {
          this._currentUser = null;
          return null;
        }
        throw error;
      } finally {
        this.resolveSessionInFlight = null;
      }
    })();

    return this.resolveSessionInFlight;
  }

  /**
   * Invalidates the local session cache.
   * Should be called after operations that change session state (login, logout, register).
   */
  private invalidateSessionCache(): void {
    this._currentUser = null;
    this.resolveSessionInFlight = null;
  }

  /**
   * Retrieves the current user's unique identifier.
   *
   * @returns A Promise that resolves to the current user ID, or null if no session is active.
   */
  async getCurrentUserId(): Promise<string | null> {
    const user = await this.resolveSession();
    return user?.$id ?? null;
  }

  /**
   * Determines the current session type to distinguish between guests and members.
   *
   * @returns A Promise that resolves to the session type or null if no session is active.
   * @throws {AppwriteException} For non-404 errors from Appwrite client calls.
   */
  async getSessionType(): Promise<
    "anonymous" | "incomplete" | "registered" | null
  > {
    const user = await this.resolveSession();

    if (!user) {
      return null;
    }

    if (!user.email) {
      return "anonymous";
    }

    try {
      await this.tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: this.profileCollectionId,
        rowId: user.$id,
      });

      return "registered";
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        return "incomplete";
      }
      throw error;
    }
  }

  /**
   * Resolves the current session with retries and exponential backoff (ADR 027).
   *
   * @param maxRetries - The maximum number of retries.
   * @returns A Promise that resolves to the user object or null.
   * @private
   */
  private async resolveSessionWithRetry(
    maxRetries = 2,
  ): Promise<Models.User<Models.Preferences> | null> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      const user = await this.resolveSession();
      if (user) return user;

      attempt++;
      if (attempt <= maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt - 1) * 100),
        );
      }
    }
    return null;
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
      const currentUser = await this.resolveSession();
      isAnonymous = currentUser !== null && !currentUser.email;
      if (isAnonymous && currentUser) {
        userId = currentUser.$id;
      }
    } catch (error: unknown) {
      // 401 (Unauthorized) means there is no active session, which is fine.
      // We re-throw any other error (network, server error) to avoid silent failures.
      if (error instanceof AppwriteException && error.code !== 401) {
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

    this.invalidateSessionCache();

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
    let priorSession: Models.User<Models.Preferences> | null = null;
    try {
      priorSession = await this.resolveSession();
      if (priorSession?.email === email) {
        // Already logged in as the correct user
        return {
          type: "authenticated",
          userId: priorSession.$id,
          email: priorSession.email,
          isNewUser: false,
        };
      }
    } catch (error: unknown) {
      // 401 is fine, other errors re-thrown
      if (!(error instanceof AppwriteException && error.code === 401)) {
        throw error;
      }
    }

    // 2. Aggressively attempt to delete any existing session before creating a new one (ADR 027)
    // This is the only way to reliably avoid "prohibited when session is active" errors
    // if the SDK's internal state is out of sync with our cached priorSession.
    try {
      await this.account.deleteSession({ sessionId: "current" });
      this.invalidateSessionCache();
    } catch {
      // Ignore errors (like 401) if no session actually existed
    }

    // 3. Create the new session
    await this.account.createEmailPasswordSession({
      email,
      password,
    });

    this.invalidateSessionCache();

    // 4. Resolve session with retry (ADR 027)
    const user = await this.resolveSessionWithRetry();

    if (!user) {
      throw new Error("Failed to resolve session after login");
    }

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
          {
            userId: await this.hashIdentifier(userId),
            errorDetails: error.message,
          },
        );
        try {
          await this.logout();
        } catch (logoutError: unknown) {
          this.logger.error(
            "Failed to logout in completeGoogleOAuth() after 401 error",
            {
              error:
                logoutError instanceof Error
                  ? logoutError.message
                  : String(logoutError),
            },
          );
        }
        throw error;
      }
      throw error;
    }

    this.invalidateSessionCache();

    // 4. Resolve session with retry (ADR 027)
    const user = await this.resolveSessionWithRetry();

    if (!user) {
      throw new Error("Failed to resolve session after OAuth completion");
    }

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
   * Deterministically obfuscates an identifier for safe logging using SHA-256 (ADR 018).
   * @param id - The raw identifier to obfuscate.
   * @returns A Promise that resolves to a masked string representation (first 8 hex chars).
   * @private
   */
  private async hashIdentifier(id: string): Promise<string> {
    if (!id) return "****";
    try {
      const msgBuffer = new TextEncoder().encode(id);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .substring(0, 8);
    } catch {
      // Safe fallback if crypto is unavailable: full redaction
      return "****";
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
    this.invalidateSessionCache();
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
      { userIdObfuscated: await this.hashIdentifier(userId) },
    );
  }

  /**
   * Explicitly starts an anonymous session.
   * @returns A Promise that resolves to the authentication result (anonymous userId).
   * @throws {AppwriteException} If session creation fails.
   */
  async loginAnonymously(): Promise<AnonymousAuthResult> {
    try {
      // Safeguard: Check if we already have Any session.
      // loginAnonymously should only be called if no session is active.
      const user = await this.resolveSession();
      if (user) {
        throw new Error(
          "Creation of an anonymous session is prohibited when a session is active.",
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("prohibited")) {
        throw error;
      }
      // 401 is expected if no session
      if (!(error instanceof AppwriteException && error.code === 401)) {
        throw error;
      }
    }

    await this.account.createAnonymousSession();
    this.invalidateSessionCache();

    // 3. Resolve session with retry (ADR 027)
    const user = await this.resolveSessionWithRetry();

    if (!user) {
      throw new Error("Failed to resolve session after anonymous login");
    }

    return {
      type: "anonymous",
      userId: user.$id,
      isNewUser: true,
    };
  }
}