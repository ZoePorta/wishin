import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { Client as ServerClient, Users } from "node-appwrite";
import { randomUUID } from "node:crypto";
import { createAppwriteClient } from "../../src/appwrite/client";
import { AppwriteAuthRepository } from "../../src/appwrite/repositories/appwrite-auth.repository";
import { Account } from "appwrite";
import type { AuthResult, Logger } from "@wishin/domain";
import "dotenv/config";

const {
  EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  APPWRITE_API_SECRET,
  EXPO_PUBLIC_DB_PREFIX,
} = process.env;
const prefix = EXPO_PUBLIC_DB_PREFIX ?? "test";

const shouldRun =
  EXPO_PUBLIC_APPWRITE_ENDPOINT &&
  EXPO_PUBLIC_APPWRITE_PROJECT_ID &&
  EXPO_PUBLIC_APPWRITE_DATABASE_ID &&
  APPWRITE_API_SECRET;

describe.skipIf(!shouldRun)("AppwriteAuthRepository Integration Test", () => {
  let serverClient: ServerClient;
  let usersService: Users;
  let client: ReturnType<typeof createAppwriteClient>;
  let repository: AppwriteAuthRepository;
  let createdUserId: string | null = null;
  let profileCollectionId: string;

  beforeAll(() => {
    const endpoint = EXPO_PUBLIC_APPWRITE_ENDPOINT!;
    const projectId = EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
    const databaseId = EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
    const apiKey = APPWRITE_API_SECRET!;
    profileCollectionId = `${prefix}_profiles`;

    // Server SDK for cleanup
    serverClient = new ServerClient()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    usersService = new Users(serverClient);

    // Client SDK (Repository under test)
    client = createAppwriteClient(endpoint, projectId);
    repository = new AppwriteAuthRepository(
      client,
      endpoint,
      projectId,
      databaseId,
      profileCollectionId,
      {
        debug: () => {
          /* no-op */
        },
        info: () => {
          /* no-op */
        },
        warn: () => {
          /* no-op */
        },
        error: () => {
          /* no-op */
        },
      } as unknown as Logger,
    );
  });

  afterEach(async () => {
    // 1. Always attempt to logout to ensure a clean state for the next test
    try {
      await repository.logout();
    } catch (_error) {
      // Ignore if no active session
    }

    // 2. Administrative cleanup (best effort)
    if (createdUserId) {
      try {
        await usersService.delete({ userId: createdUserId });
      } catch (_error) {
        // Ignore if user doesn't exist or already deleted
      }
      createdUserId = null;
    }
  });

  it("should register a new user successfully", async () => {
    const email = `test-${randomUUID()}@example.com`;
    const password = "Password123!";

    const result: AuthResult = await repository.register(
      email,
      password,
      "testuser",
    );

    expect(result).toBeDefined();
    expect(result.email).toBe(email);
    expect(result.userId).toBeDefined();
    expect(result.isNewUser).toBe(true);

    createdUserId = result.userId;
  });

  it("should login a user successfully", async () => {
    const email = `test-${randomUUID()}@example.com`;
    const password = "Password123!";

    // 1. Create user using repository (since API key lacks users.write scope)
    const user = await repository.register(email, password, "testuser");
    createdUserId = user.userId;

    // 2. Login using repository
    const result: AuthResult = await repository.login(email, password);

    expect(result).toBeDefined();
    expect(result.email).toBe(email);
    expect(result.userId).toBe(createdUserId);
    expect(result.isNewUser).toBe(false);
  });

  it("should logout successfully", async () => {
    const email = `test-${randomUUID()}@example.com`;
    const password = "Password123!";

    // 1. Setup session
    const user = await repository.register(email, password, "testuser");
    createdUserId = user.userId;
    await repository.login(email, password);

    // 2. Logout
    await repository.logout();

    // 3. Verify session was removed by attempting an authenticated call
    const account = new Account(client);
    await expect(account.get()).rejects.toThrow();
  });

  describe("Session Preservation and Overlap", () => {
    it("should allow idempotent anonymous login", async () => {
      // 1. First anonymous login
      const firstResult = await repository.loginAnonymously();
      expect(firstResult.type).toBe("anonymous");
      const firstId = firstResult.userId;

      // 2. Second anonymous login should succeed and return the same ID
      const secondResult = await repository.loginAnonymously();
      expect(secondResult.type).toBe("anonymous");
      expect(secondResult.userId).toBe(firstId);
    });

    it("should recover an anonymous session when email login fails (even if ID changes)", async () => {
      // 1. Start as guest
      await repository.loginAnonymously();

      // 2. Attempt login with non-existent account
      const wrongEmail = `wrong-${randomUUID()}@example.com`;
      await expect(
        repository.login(wrongEmail, "WrongPassword123!"),
      ).rejects.toThrow();

      // 3. Verify STILL guest (ID may change due to session deletion/recreation on limited platforms)
      const account = new Account(client);
      const currentUser = await account.get();
      expect(currentUser.email).toBe("");
      expect(currentUser.$id).toBeDefined();
    });

    it("should NOT create anonymous session when email login fails and no prior session existed", async () => {
      // 1. Ensure NO session
      try {
        await repository.logout();
      } catch {
        // Ignore
      }

      // 2. Attempt login with non-existent account
      const wrongEmail = `wrong-${randomUUID()}@example.com`;
      await expect(
        repository.login(wrongEmail, "WrongPassword123!"),
      ).rejects.toThrow();

      // 3. Verify STILL no session
      const account = new Account(client);
      await expect(account.get()).rejects.toThrow();
    });

    it("should replace anonymous session when email login succeeds", async () => {
      // 1. Start as guest
      const guestResult = await repository.loginAnonymously();
      const guestId = guestResult.userId;

      // 2. Register a user (different email)
      const userEmail = `member-${randomUUID()}@example.com`;
      const userPassword = "Password123!";
      const registerResult = await repository.register(
        userEmail,
        userPassword,
        "testuser",
      );
      createdUserId = registerResult.userId;

      // 3. Login with the new user
      const loginResult = await repository.login(userEmail, userPassword);
      expect(loginResult.userId).toBe(guestId);
      expect(loginResult.email).toBe(userEmail);

      // 4. Verify guest session is gone
      const account = new Account(client);
      const currentUser = await account.get();
      expect(currentUser.$id).toBe(loginResult.userId);
      expect(currentUser.email).toBe(userEmail);
    });
  });
});
