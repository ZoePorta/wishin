import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import { Client as ServerClient, TablesDB } from "node-appwrite";
import { randomUUID } from "node:crypto";
import { createAppwriteClient } from "../../src/appwrite/client";
import { AppwriteWishlistRepository } from "../../src/appwrite/repositories/appwrite-wishlist.repository";
import {
  Wishlist,
  Visibility,
  Participation,
  Priority,
  TransactionStatus,
} from "@wishin/domain";
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
    let usersCollectionId: string;
    let transactionsCollectionId: string;

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
      usersCollectionId = `${prefix}_users`;
      transactionsCollectionId = `${prefix}_transactions`;

      repository = new AppwriteWishlistRepository(
        client,
        databaseId,
        wishlistCollectionId,
        wishlistItemsCollectionId,
        transactionsCollectionId,
      );
    });

    const wishlistId = randomUUID();
    const item1Id = randomUUID();
    const ownerId = randomUUID();
    const transactionId = randomUUID();

    afterEach(async () => {
      try {
        await tablesDb.deleteRow({
          databaseId,
          tableId: transactionsCollectionId,
          rowId: transactionId,
        });
      } catch {
        // Ignore if not found
      }

      try {
        await tablesDb.deleteRow({
          databaseId,
          tableId: wishlistItemsCollectionId,
          rowId: item1Id,
        });
      } catch {
        // Ignore if not found
      }

      try {
        await tablesDb.deleteRow({
          databaseId,
          tableId: wishlistCollectionId,
          rowId: wishlistId,
        });
      } catch {
        // Ignore if not found
      }

      try {
        await tablesDb.deleteRow({
          databaseId,
          tableId: usersCollectionId,
          rowId: ownerId,
        });
      } catch {
        // Ignore if not found
      }
    });

    it("should find a wishlist by id including its items and calculated quantities", async () => {
      // 0. Seed User (Required for relationship)
      await tablesDb.createRow({
        databaseId,
        tableId: usersCollectionId,
        rowId: ownerId,
        data: {
          email: "test@example.com",
          username: "testuser",
        },
      });

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
        },
      });

      // 2. Seed Wishlist Items (WITHOUT reserved/purchased quantity)
      await tablesDb.createRow({
        databaseId,
        tableId: wishlistItemsCollectionId,
        rowId: item1Id,
        data: {
          wishlistId,
          name: "Mechanical Keyboard",
          priority: Priority.HIGH,
          totalQuantity: 5,
          isUnlimited: false,
        },
      });

      // 3. Seed Transactions (To verify calculation)
      await tablesDb.createRow({
        databaseId,
        tableId: transactionsCollectionId,
        rowId: transactionId,
        data: {
          itemId: item1Id,
          userId: ownerId,
          status: TransactionStatus.RESERVED,
          quantity: 2,
        },
      });

      // 4. Wait for indices & Act
      await vi.waitUntil(
        async () => {
          const res = await repository.findById(wishlistId);
          return (
            res !== null &&
            res.items.length === 1 &&
            res.items[0].reservedQuantity === 2
          );
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
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].name).toBe("Mechanical Keyboard");
      // Verify calculated quantities
      expect(result?.items[0].reservedQuantity).toBe(2);
      expect(result?.items[0].purchasedQuantity).toBe(0);
    });

    it("should return null if wishlist does not exist", async () => {
      const result = await repository.findById(randomUUID());
      expect(result).toBeNull();
    });
  },
);
