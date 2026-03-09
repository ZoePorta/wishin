/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-deprecated */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppwriteAuthRepository } from "./appwrite-auth.repository";
import { Client, Account, OAuthProvider } from "appwrite";

// Mock Appwrite SDK
vi.mock("appwrite", () => {
  const accountMock = {
    create: vi.fn(),
    createEmailPasswordSession: vi.fn(),
    get: vi.fn(),
    createOAuth2Session: vi.fn(),
    deleteSession: vi.fn(),
  };

  const ClientMock = vi.fn().mockImplementation(function (this: any) {
    this.setEndpoint = vi.fn().mockReturnThis();
    this.setProject = vi.fn().mockReturnThis();
  });

  const AccountMock = vi.fn().mockImplementation(function (this: any) {
    Object.assign(this, accountMock);
  });

  return {
    Client: ClientMock,
    Account: AccountMock,
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
    client = new (Client as any)();
    repository = new AppwriteAuthRepository(client);
    // Access the mocked account instance through the repository
    account = (repository as any).account;
  });

  describe("loginWithGoogle", () => {
    it("should initiate OAuth2 flow with Google", async () => {
      await repository.loginWithGoogle();

      expect(account.createOAuth2Session).toHaveBeenCalledWith({
        provider: OAuthProvider.Google,
      });
    });
  });

  describe("register", () => {
    it("should create a user and return AuthResult", async () => {
      const email = "test@example.com";
      const password = "Password123!";
      const userId = "user-123";

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
      expect(result).toEqual({ userId, email });
    });
  });

  describe("login", () => {
    it("should create a session and return AuthResult", async () => {
      const email = "test@example.com";
      const password = "Password123!";
      const userId = "user-123";

      vi.mocked(account.createEmailPasswordSession).mockResolvedValue(
        {} as any,
      );
      vi.mocked(account.get).mockResolvedValue({
        $id: userId,
        email,
      } as any);

      const result = await repository.login(email, password);

      expect(account.createEmailPasswordSession).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(account.get).toHaveBeenCalled();
      expect(result).toEqual({ userId, email });
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
});
