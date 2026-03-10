import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppwriteAuthRepository } from "./appwrite-auth.repository";
import {
  Client,
  Account,
  OAuthProvider,
  AppwriteException,
  type Models,
} from "appwrite";

// Mock Appwrite SDK
vi.mock("appwrite", () => {
  const accountMock = {
    create: vi.fn(),
    createEmailPasswordSession: vi.fn(),
    get: vi.fn(),
    createOAuth2Session: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn(),
  };

  const ClientMock = vi.fn().mockImplementation(function () {
    return {
      setEndpoint: vi.fn().mockReturnThis(),
      setProject: vi.fn().mockReturnThis(),
    };
  });

  const AccountMock = vi.fn().mockImplementation(function () {
    return accountMock;
  });

  class AppwriteException extends Error {
    constructor(
      public override message: string,
      public code = 0,
    ) {
      super(message);
      this.name = "AppwriteException";
    }
  }

  return {
    Client: ClientMock,
    Account: AccountMock,
    AppwriteException,
    ID: {
      unique: () => "unique-id",
    },
    OAuthProvider: {
      Google: "google" as OAuthProvider,
    },
  };
});

describe("AppwriteAuthRepository", () => {
  let repository: AppwriteAuthRepository;
  let client: Client;
  let account: Account;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new Client();
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    repository = new AppwriteAuthRepository(client, logger);
    // @ts-expect-error - access private for testing
    account = repository.account;
  });

  describe("getGoogleOAuthUrl", () => {
    it("should return the OAuth2 token URL and a random state", async () => {
      const mockUrl = "https://appwrite.io/oauth/google";
      const createOAuth2TokenSpy = vi
        .spyOn(account, "createOAuth2Token")
        .mockReturnValue(mockUrl);

      const result = await repository.getGoogleOAuthUrl();

      expect(result.url).toBe(mockUrl);
      expect(result.state).toBeDefined();
      expect(result.state.length).toBeGreaterThan(5);
      expect(createOAuth2TokenSpy).toHaveBeenCalledWith({
        provider: OAuthProvider.Google,
      });
    });

    it("should throw if Appwrite fails to generate a URL", async () => {
      vi.spyOn(account, "createOAuth2Token").mockReturnValue("");

      await expect(repository.getGoogleOAuthUrl()).rejects.toThrow(
        "Failed to generate Google OAuth2 URL",
      );
    });
  });

  describe("completeGoogleOAuth", () => {
    it("should create a session when state matches", async () => {
      // 1. Generate a URL and state
      vi.spyOn(account, "createOAuth2Token").mockReturnValue("http://url");
      const initiation = await repository.getGoogleOAuthUrl();

      // 2. Complete flow
      const callbackUrl =
        "exp://localhost:8081?userId=user-123&secret=secret-456";
      const mockUser = {
        $id: "user-123",
        email: "test@example.com",
      } as Models.User<Models.Preferences>;

      const createSessionSpy = vi
        .spyOn(account, "createSession")
        .mockResolvedValue({} as Models.Session);
      vi.spyOn(account, "get").mockResolvedValue(mockUser);

      const result = await repository.completeGoogleOAuth(
        callbackUrl,
        initiation.state,
      );

      expect(result.userId).toBe("user-123");
      expect(createSessionSpy).toHaveBeenCalled();
    });

    it("should throw if state is invalid or missing", async () => {
      const callbackUrl =
        "exp://localhost:8081?userId=user-123&secret=secret-456";

      await expect(
        repository.completeGoogleOAuth(callbackUrl, "invalid-state"),
      ).rejects.toThrow(/Invalid OAuth state/);
    });

    it("should cleanup state after successful verification", async () => {
      vi.spyOn(account, "createOAuth2Token").mockReturnValue("http://url");
      const initiation = await repository.getGoogleOAuthUrl();

      vi.spyOn(account, "createSession").mockResolvedValue(
        {} as Models.Session,
      );
      vi.spyOn(account, "get").mockResolvedValue({
        $id: "1",
        email: "a",
      } as Models.User<Models.Preferences>);

      await repository.completeGoogleOAuth(
        "exp://?userId=1&secret=s",
        initiation.state,
      );

      // Second attempt with same state should fail
      await expect(
        repository.completeGoogleOAuth(
          "exp://?userId=1&secret=s",
          initiation.state,
        ),
      ).rejects.toThrow(/Invalid OAuth state/);
    });

    it("should throw if userId or secret are missing in URL", async () => {
      vi.spyOn(account, "createOAuth2Token").mockReturnValue("http://url");
      const initiation = await repository.getGoogleOAuthUrl();

      const invalidUrl = "exp://localhost:8081?userId=user-123";

      await expect(
        repository.completeGoogleOAuth(invalidUrl, initiation.state),
      ).rejects.toThrow(/missing userId or secret/);
    });
  });

  describe("register", () => {
    it("should create a new user and return AuthResult with isNewUser: true", async () => {
      const email = "test@example.com";
      const password = "Password123!";
      const userId = "user-123";

      const getSpy = vi.spyOn(account, "get");
      const createSpy = vi.spyOn(account, "create");

      getSpy.mockRejectedValueOnce(new AppwriteException("No session", 401));

      createSpy.mockResolvedValue({
        $id: userId,
        email,
      } as Models.User<Models.Preferences>);

      const result = await repository.register(email, password);

      expect(createSpy).toHaveBeenCalledWith({
        userId: "unique-id",
        email,
        password,
      });
      expect(result).toEqual({ userId, email, isNewUser: true });
    });

    it("should promote an anonymous session if active", async () => {
      const email = "test@example.com";
      const password = "Password123!";
      const userId = "anonymous-123";

      const getSpy = vi.spyOn(account, "get");
      const createSpy = vi.spyOn(account, "create");

      getSpy.mockResolvedValueOnce({
        $id: userId,
        email: "",
      } as Models.User<Models.Preferences>);

      createSpy.mockResolvedValue({
        $id: userId,
        email,
      } as Models.User<Models.Preferences>);

      const result = await repository.register(email, password);

      expect(createSpy).toHaveBeenCalledWith({
        userId,
        email,
        password,
      });
      expect(result).toEqual({ userId, email, isNewUser: false });
    });
  });

  describe("login", () => {
    it("should create a session and return AuthResult", async () => {
      const email = "test@example.com";
      const password = "Password123!";
      const userId = "user-123";

      const createEmailPasswordSessionSpy = vi.spyOn(
        account,
        "createEmailPasswordSession",
      );
      const getSpy = vi.spyOn(account, "get");

      createEmailPasswordSessionSpy.mockResolvedValue({} as Models.Session);
      getSpy.mockResolvedValue({
        $id: userId,
        email,
      } as Models.User<Models.Preferences>);

      const result = await repository.login(email, password);

      expect(createEmailPasswordSessionSpy).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(getSpy).toHaveBeenCalled();
      expect(result).toEqual({ userId, email, isNewUser: false });
    });
  });

  describe("logout", () => {
    it("should delete the current session", async () => {
      const deleteSessionSpy = vi.spyOn(account, "deleteSession");
      deleteSessionSpy.mockResolvedValue({} as Models.Session);

      await repository.logout();

      expect(deleteSessionSpy).toHaveBeenCalledWith({
        sessionId: "current",
      });
    });
  });

  describe("deleteUser", () => {
    it("should log a warning as it is suppressed for Incomplete Account strategy", async () => {
      // @ts-expect-error - access private logger for verification
      const logger = repository.logger;
      const warnSpy = vi.spyOn(logger, "warn");

      await repository.deleteUser("user-123");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("suppressed"),
        expect.objectContaining({ userIdObfuscated: "user****" }),
      );
    });
  });
});
