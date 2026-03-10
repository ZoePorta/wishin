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
    createOAuth2Token: vi.fn(),
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
    it("should return the OAuth2 token URL from Appwrite", async () => {
      const mockUrl = "https://appwrite.io/oauth/google";
      const createOAuth2Token = vi.spyOn(account, "createOAuth2Token");
      createOAuth2Token.mockReturnValue(mockUrl);

      const url = await repository.getGoogleOAuthUrl();

      expect(url).toEqual({
        url: mockUrl,
        state: "appwrite-internal",
      });
      expect(createOAuth2Token).toHaveBeenCalledWith({
        provider: OAuthProvider.Google,
      });
    });

    it("should throw if Appwrite fails to generate a URL", async () => {
      const createOAuth2Token = vi.spyOn(account, "createOAuth2Token");
      createOAuth2Token.mockReturnValue("");

      await expect(repository.getGoogleOAuthUrl()).rejects.toThrow(
        "Failed to generate Google OAuth2 URL",
      );
    });
  });

  describe("completeGoogleOAuth", () => {
    it("should create a session and return AuthResult from callback URL", async () => {
      const callbackUrl =
        "exp://localhost:8081?userId=user-123&secret=secret-456";
      const mockUser = {
        $id: "user-123",
        email: "test@example.com",
      } as Models.User<Models.Preferences>;

      const createSession = vi.spyOn(account, "createSession");
      const get = vi.spyOn(account, "get");

      createSession.mockResolvedValue({} as Models.Session);
      get.mockResolvedValue(mockUser);

      const result = await repository.completeGoogleOAuth(
        callbackUrl,
        "any-state",
      );

      expect(createSession).toHaveBeenCalledWith({
        userId: "user-123",
        secret: "secret-456",
      });
      expect(result).toEqual({
        userId: "user-123",
        email: "test@example.com",
        isNewUser: false,
      });
    });

    it("should throw if userId or secret are missing in URL", async () => {
      const invalidUrl = "exp://localhost:8081?userId=user-123";

      await expect(
        repository.completeGoogleOAuth(invalidUrl, "state"),
      ).rejects.toThrow(/missing userId or secret/);
    });
  });

  describe("register", () => {
    it("should create a new user and return AuthResult with isNewUser: true", async () => {
      const email = "test@example.com";
      const password = "Password123!";
      const userId = "user-123";

      const get = vi.spyOn(account, "get");
      const create = vi.spyOn(account, "create");

      get.mockRejectedValueOnce(new AppwriteException("No session", 401));

      create.mockResolvedValue({
        $id: userId,
        email,
      } as Models.User<Models.Preferences>);

      const result = await repository.register(email, password);

      expect(create).toHaveBeenCalledWith({
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

      const get = vi.spyOn(account, "get");
      const create = vi.spyOn(account, "create");

      get.mockResolvedValueOnce({
        $id: userId,
        email: "",
      } as Models.User<Models.Preferences>);

      create.mockResolvedValue({
        $id: userId,
        email,
      } as Models.User<Models.Preferences>);

      const result = await repository.register(email, password);

      expect(create).toHaveBeenCalledWith({
        userId,
        email,
        password,
      });
      expect(result).toEqual({ userId, email, isNewUser: false });
    });

    it("should propagate errors from register", async () => {
      const error = new Error("Registration failed");
      const create = vi.spyOn(account, "create");
      const get = vi.spyOn(account, "get");

      create.mockRejectedValueOnce(error);
      get.mockRejectedValueOnce(new AppwriteException("No session", 401));

      await expect(
        repository.register("test@example.com", "pass"),
      ).rejects.toThrow("Registration failed");
    });
  });

  describe("login", () => {
    it("should create a session and return AuthResult", async () => {
      const email = "test@example.com";
      const password = "Password123!";
      const userId = "user-123";

      const createEmailPasswordSession = vi.spyOn(
        account,
        "createEmailPasswordSession",
      );
      const get = vi.spyOn(account, "get");

      createEmailPasswordSession.mockResolvedValue({} as Models.Session);
      get.mockResolvedValue({
        $id: userId,
        email,
      } as Models.User<Models.Preferences>);

      const result = await repository.login(email, password);

      expect(createEmailPasswordSession).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(get).toHaveBeenCalled();
      expect(result).toEqual({ userId, email, isNewUser: false });
    });
  });

  describe("logout", () => {
    it("should delete the current session", async () => {
      const deleteSession = vi.spyOn(account, "deleteSession");
      deleteSession.mockResolvedValue({} as Models.Session);

      await repository.logout();

      expect(deleteSession).toHaveBeenCalledWith({
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
