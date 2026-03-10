import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { Client as ServerClient, Users } from "node-appwrite";
import { randomUUID } from "node:crypto";
import { createAppwriteClient } from "../../src/appwrite/client";
import { AppwriteAuthRepository } from "../../src/appwrite/repositories/appwrite-auth.repository";
import { Account } from "appwrite";
import type { AuthResult } from "@wishin/domain";
import "dotenv/config";

const {
  EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  APPWRITE_API_SECRET,
} = process.env;

const shouldRun =
  EXPO_PUBLIC_APPWRITE_ENDPOINT &&
  EXPO_PUBLIC_APPWRITE_PROJECT_ID &&
  APPWRITE_API_SECRET;

describe.skipIf(!shouldRun)("AppwriteAuthRepository Integration Test", () => {
  let serverClient: ServerClient;
  let usersService: Users;
  let client: ReturnType<typeof createAppwriteClient>;
  let repository: AppwriteAuthRepository;
  let createdUserId: string | null = null;

  beforeAll(() => {
    const endpoint = EXPO_PUBLIC_APPWRITE_ENDPOINT!;
    const projectId = EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
    const apiKey = APPWRITE_API_SECRET!;

    // Server SDK for cleanup
    serverClient = new ServerClient()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    usersService = new Users(serverClient);

    // Client SDK (Repository under test)
    client = createAppwriteClient(endpoint, projectId);
    repository = new AppwriteAuthRepository(client);
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
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        await usersService.delete(createdUserId);
      } catch (_error) {
        // Ignore if user doesn't exist or already deleted
      }
      createdUserId = null;
    }
  });

  it("should register a new user successfully", async () => {
    const email = `test-${randomUUID()}@example.com`;
    const password = "Password123!";

    const result: AuthResult = await repository.register(email, password);

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
    const user = await repository.register(email, password);
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
    const user = await repository.register(email, password);
    createdUserId = user.userId;
    await repository.login(email, password);

    // 2. Logout
    await repository.logout();

    // 3. Verify session was removed by attempting an authenticated call
    const account = new Account(client);
    await expect(account.get()).rejects.toThrow();
  });

  // Note: Google OAuth2 integration test removed as requested to avoid white-boxing private internals.
  // Observable behavior (redirection logic) is covered by unit tests.
});
