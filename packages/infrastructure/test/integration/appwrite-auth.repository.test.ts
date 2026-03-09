/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import { Client as ServerClient, Users } from "node-appwrite";
import { randomUUID } from "node:crypto";
import { createAppwriteClient } from "../../src/appwrite/client";
import { AppwriteAuthRepository } from "../../src/appwrite/repositories/appwrite-auth.repository";
import { OAuthProvider } from "appwrite";
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

    const result = await repository.register(email, password);

    expect(result).toBeDefined();
    expect(result.email).toBe(email);
    expect(result.userId).toBeDefined();

    createdUserId = result.userId;
  });

  it("should login a user successfully", async () => {
    const email = `test-${randomUUID()}@example.com`;
    const password = "Password123!";

    // 1. Create user using repository (since API key lacks users.write scope)
    const user = await repository.register(email, password);
    createdUserId = user.userId;

    // 2. Login using repository
    const result = await repository.login(email, password);

    expect(result).toBeDefined();
    expect(result.email).toBe(email);
    expect(result.userId).toBe(createdUserId);
  });

  it("should logout successfully", async () => {
    const email = `test-${randomUUID()}@example.com`;
    const password = "Password123!";

    // 1. Setup session
    const user = await repository.register(email, password);
    createdUserId = user.userId;
    await repository.login(email, password);

    // 2. Logout
    await expect(repository.logout()).resolves.not.toThrow();
  });

  it("should initiate Google OAuth2 flow", async () => {
    // Create a spy on the account service within the repository to verify the call
    const createOAuth2SessionSpy = vi.spyOn(
      (repository as any).account,
      "createOAuth2Session",
    );

    await repository.loginWithGoogle();

    expect(createOAuth2SessionSpy).toHaveBeenCalledWith({
      provider: OAuthProvider.Google,
    });

    createOAuth2SessionSpy.mockRestore();
  });
});
