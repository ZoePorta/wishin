import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { Client as ServerClient, TablesDB } from "node-appwrite";
import { randomUUID } from "node:crypto";
import { createAppwriteClient } from "../../src/appwrite/client";
import { AppwriteWishlistRepository } from "../../src/appwrite/repositories/appwrite-wishlist.repository";
import { Wishlist, Visibility, Participation, Priority } from "@wishin/domain";
import "dotenv/config";

const {
  EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  APPWRITE_API_SECRET,
  EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  EXPO_PUBLIC_DB_PREFIX,
} = process.env;

const shouldRun =
  EXPO_PUBLIC_APPWRITE_ENDPOINT &&
  EXPO_PUBLIC_APPWRITE_PROJECT_ID &&
  APPWRITE_API_SECRET &&
  EXPO_PUBLIC_APPWRITE_DATABASE_ID;

describe.skipIf(!shouldRun)(
  "AppwriteWishlistRepository Integration Test",
  () => {
    let serverClient: ServerClient;
    let tablesDb: TablesDB;
    let client: ReturnType<typeof createAppwriteClient>;
    let repository: AppwriteWishlistRepository;
    let databaseId: string;
    let wishlistCollectionId: string;
    let wishlistItemsCollectionId: string;

    beforeAll(() => {
      const endpoint = EXPO_PUBLIC_APPWRITE_ENDPOINT!;
      const projectId = EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
      const apiKey = APPWRITE_API_SECRET!;
      databaseId = EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
      const prefix = EXPO_PUBLIC_DB_PREFIX ?? "test";

      // Server SDK for seeding
      serverClient = new ServerClient()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);
      tablesDb = new TablesDB(serverClient);

      // Client SDK (Repository under test)
      client = createAppwriteClient(endpoint, projectId);

      wishlistCollectionId = `${prefix}_wishlists`;
      wishlistItemsCollectionId = `${prefix}_wishlist_items`;

      repository = new AppwriteWishlistRepository(
        client,
        databaseId,
        wishlistCollectionId,
        wishlistItemsCollectionId,
      );
    });

    const wishlistId = randomUUID();
    const ownerId = randomUUID();

    beforeEach(async () => {
      // Note: Provisioning script should have created the collections.
      // We just seed data here.
    });

    it("should find a wishlist by id including its items", async () => {
      // 1. Seed Wishlist
      await tablesDb.createRow({
        databaseId,
        tableId: wishlistCollectionId,
        rowId: wishlistId,
        data: {
          ownerId,
          title: "My Birthday Wishlist",
          description: "Things I want for my birthday",
          visibility: Visibility.LINK,
          participation: Participation.ANYONE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        // Note: Collection has read("any") permissions in provision.ts
      });

      // 2. Seed Wishlist Items
      const item1Id = randomUUID();
      await tablesDb.createRow({
        databaseId,
        tableId: wishlistItemsCollectionId,
        rowId: item1Id,
        data: {
          wishlistId,
          name: "Mechanical Keyboard",
          priority: Priority.HIGH,
          totalQuantity: 1,
          reservedQuantity: 0,
          purchasedQuantity: 0,
          isUnlimited: false,
        },
      });

      // 3. Wait for indices (Appwrite is eventually consistent for queries) & Act
      // We poll until the repository returns the wishlist with the expected item count.
      await vi.waitUntil(
        async () => {
          const res = await repository.findById(wishlistId);
          return res !== null && res.items.length === 1;
        },
        {
          timeout: 5000,
          interval: 200,
        },
      );

      const result = await repository.findById(wishlistId);

      // 5. Assert
      expect(result).toBeInstanceOf(Wishlist);
      expect(result?.id).toBe(wishlistId);
      expect(result?.title).toBe("My Birthday Wishlist");
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].name).toBe("Mechanical Keyboard");
    });

    it("should return null if wishlist does not exist", async () => {
      const result = await repository.findById(randomUUID());
      expect(result).toBeNull();
    });
  },
);
