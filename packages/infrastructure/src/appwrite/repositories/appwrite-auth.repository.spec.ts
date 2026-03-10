/* eslint-disable @typescript-eslint/no-deprecated */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

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
    deleteSession: vi.fn(),
  };

  const ClientMock = vi.fn().mockImplementation(function (this: Client) {
    this.setEndpoint = vi.fn().mockReturnThis();
    this.setProject = vi.fn().mockReturnThis();
  });

  const AccountMock = vi.fn().mockImplementation(function (this: Account) {
    Object.assign(this, accountMock);
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
      Google: "google" as any,
    },
  };
});

describe("AppwriteAuthRepository", () => {
  let repository: AppwriteAuthRepository;
  let client: Client;
  let account: Account;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new (Client as any)() as Client;
    repository = new AppwriteAuthRepository(client);
    // Access the mocked account instance through the repository
    account = (repository as any).account as Account;
  });

  describe("loginWithGoogle", () => {
    it("should initiate OAuth2 token flow with Google and throw unimplemented error with URL", async () => {
      const mockUrl = "https://appwrite.io/oauth/google";
      vi.mocked(account.createOAuth2Token).mockReturnValue(mockUrl);

      await expect(repository.loginWithGoogle()).rejects.toThrow(
        /https:\/\/appwrite\.io\/oauth\/google/,
      );

      expect(account.createOAuth2Token).toHaveBeenCalledWith({
        provider: OAuthProvider.Google,
      });
    });

    it("should propagate errors from createOAuth2Token", async () => {
      const error = new Error("OAuth initiation failed");
      vi.mocked(account.createOAuth2Token).mockImplementation(() => {
        throw error;
      });

      await expect(repository.loginWithGoogle()).rejects.toThrow(
        "OAuth initiation failed",
      );
    });
  });

  describe("register", () => {
    it("should create a new user and return AuthResult with isNewUser: true", async () => {
      const email = "test@example.com";
      const password = "Password123!";
      const userId = "user-123";

      // Mock no active session (401 Unauthorized)
      vi.mocked(account.get).mockRejectedValueOnce(
        new AppwriteException("No session", 401),
      );

      vi.mocked(account.create).mockResolvedValue({
        $id: userId,
        email,
      } as any);

      const result = await repository.register(email, password);

      expect(account.create).toHaveBeenCalledWith({
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

      // 1. Mock active anonymous session (no email)
      vi.mocked(account.get).mockResolvedValueOnce({
        $id: userId,
        email: "",
      } as any);

      // 2. Mock create success (Appwrite converts the session)
      vi.mocked(account.create).mockResolvedValue({
        $id: userId,
        email,
      } as any);

      const result = await repository.register(email, password);

      expect(account.create).toHaveBeenCalledWith({
        userId: "unique-id",
        email,
        password,
      });
      expect(result).toEqual({ userId, email, isNewUser: false });
    });

    it("should propagate errors from register", async () => {
      const error = new Error("Registration failed");
      vi.mocked(account.create).mockRejectedValueOnce(error);
      vi.mocked(account.get).mockRejectedValueOnce(
        new AppwriteException("No session", 401),
      );

      await expect(
        repository.register("test@example.com", "pass"),
      ).rejects.toThrow("Registration failed");
    });

    it("should propagate unexpected errors from account.get during register", async () => {
      const error = new AppwriteException("Network error", 500);
      vi.mocked(account.get).mockRejectedValueOnce(error);

      await expect(
        repository.register("test@example.com", "pass"),
      ).rejects.toEqual(error);
      expect(account.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should create a session and return AuthResult", async () => {
      const email = "test@example.com";
      const password = "Password123!";
      const userId = "user-123";

      vi.mocked(account.createEmailPasswordSession).mockResolvedValue(
        {} as Models.Session,
      );
      vi.mocked(account.get).mockResolvedValue({
        $id: userId,
        email,
      } as Models.User<Models.Preferences>);

      const result = await repository.login(email, password);

      expect(account.createEmailPasswordSession).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(account.get).toHaveBeenCalled();
      expect(result).toEqual({ userId, email, isNewUser: false });
    });
  });

  describe("logout", () => {
    it("should delete the current session", async () => {
      vi.mocked(account.deleteSession).mockResolvedValue({} as any);

      await repository.logout();

      expect(account.deleteSession).toHaveBeenCalledWith({
        sessionId: "current",
      });
    });
  });

  describe("deleteUser", () => {
    it("should log a warning as it is suppressed for Incomplete Account strategy", async () => {
      const consoleSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
      await repository.deleteUser("user-123");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("suppressed"),
      );
      consoleSpy.mockRestore();
    });
  });
});
