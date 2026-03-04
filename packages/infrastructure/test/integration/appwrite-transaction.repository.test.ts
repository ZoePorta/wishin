import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import { Client as ServerClient, TablesDB } from "node-appwrite";
import { randomUUID } from "node:crypto";
import { createAppwriteClient } from "@wishin/infrastructure/appwrite/client";
import { AppwriteTransactionRepository } from "@wishin/infrastructure/appwrite/repositories/appwrite-transaction.repository";
import { Transaction, TransactionStatus } from "@wishin/domain";
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
  "AppwriteTransactionRepository Integration Test",
  () => {
    let serverClient: ServerClient;
    let tablesDb: TablesDB;
    let client: ReturnType<typeof createAppwriteClient>;
    let repository: AppwriteTransactionRepository;
    let databaseId: string;
    let transactionsCollectionId: string;
    let wishlistItemsCollectionId: string;
    let wishlistsCollectionId: string;
    let profilesCollectionId: string;

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

      transactionsCollectionId = `${prefix}_transactions`;
      wishlistItemsCollectionId = `${prefix}_wishlist_items`;
      wishlistsCollectionId = `${prefix}_wishlists`;
      profilesCollectionId = `${prefix}_profiles`;

      repository = new AppwriteTransactionRepository(
        client,
        databaseId,
        transactionsCollectionId,
      );
    });

    // Helper to seed required parent records
    async function seedParentRecords(
      itemId: string,
    ): Promise<{ profileId: string; wishlistId: string; itemId: string }> {
      const profileId = randomUUID();
      const wishlistId = randomUUID();

      await tablesDb.createRow({
        databaseId,
        tableId: profilesCollectionId,
        rowId: profileId,
        data: { username: "testuser" },
      });

      await tablesDb.createRow({
        databaseId,
        tableId: wishlistsCollectionId,
        rowId: wishlistId,
        data: {
          ownerId: profileId,
          title: "Test Wishlist",
          visibility: "LINK",
          participation: "ANYONE",
        },
      });

      await tablesDb.createRow({
        databaseId,
        tableId: wishlistItemsCollectionId,
        rowId: itemId,
        data: {
          wishlistId,
          name: "Test Item",
          priority: 1,
        },
      });

      return { profileId, wishlistId, itemId };
    }

    async function cleanupParentRecords(
      itemId: string,
      wishlistId: string,
      profileId: string,
    ): Promise<void> {
      await tablesDb
        .deleteRow({
          databaseId,
          tableId: wishlistItemsCollectionId,
          rowId: itemId,
        })
        .catch(() => {});
      await tablesDb
        .deleteRow({
          databaseId,
          tableId: wishlistsCollectionId,
          rowId: wishlistId,
        })
        .catch(() => {});
      await tablesDb
        .deleteRow({
          databaseId,
          tableId: profilesCollectionId,
          rowId: profileId,
        })
        .catch(() => {});
    }

    let transactionId: string;
    let itemId: string;
    let userId: string;

    afterEach(async () => {
      if (transactionId) {
        await tablesDb
          .deleteRow({
            databaseId,
            tableId: transactionsCollectionId,
            rowId: transactionId,
          })
          .catch(() => void 0);
      }
    });

    it("should save and find a transaction by id", async () => {
      transactionId = randomUUID();
      itemId = randomUUID();
      userId = randomUUID();

      const transaction = Transaction.reconstitute({
        id: transactionId,
        itemId,
        userId,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.save(transaction);

      // Wait for indices
      await vi.waitUntil(
        async () => {
          const res = await repository.findById(transactionId);
          return res !== null;
        },
        { timeout: 5000, interval: 200 },
      );

      const found = await repository.findById(transactionId);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(transactionId);
      expect(found?.status).toBe(TransactionStatus.RESERVED);
    });

    it("should find a transaction by id", async () => {
      const localId = randomUUID();
      const localItem = randomUUID();
      const localUser = randomUUID();
      const transaction = Transaction.reconstitute({
        id: localId,
        itemId: localItem,
        userId: localUser,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(transaction);

      const found = await repository.findById(localId);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(localId);
    });

    it("should find transactions by itemId", async () => {
      itemId = randomUUID();
      const t1Id = randomUUID();
      const t2Id = randomUUID();

      // Seed transactions for the same item
      await tablesDb.createRow({
        databaseId,
        tableId: transactionsCollectionId,
        rowId: t1Id,
        data: {
          itemId,
          userId: randomUUID(),
          status: TransactionStatus.RESERVED,
          quantity: 1,
        },
      });

      await tablesDb.createRow({
        databaseId,
        tableId: transactionsCollectionId,
        rowId: t2Id,
        data: {
          itemId,
          userId: randomUUID(),
          status: TransactionStatus.PURCHASED,
          quantity: 1,
        },
      });

      try {
        await vi.waitUntil(
          async () => {
            const results = await repository.findByItemId(itemId);
            return results.length >= 2;
          },
          { timeout: 5000, interval: 200 },
        );

        const results = await repository.findByItemId(itemId);
        expect(results.length).toBeGreaterThanOrEqual(2);
        expect(results.some((r) => r.itemId === itemId)).toBe(true);
      } finally {
        await tablesDb
          .deleteRow({
            databaseId,
            tableId: transactionsCollectionId,
            rowId: t1Id,
          })
          .catch(() => void 0);
        await tablesDb
          .deleteRow({
            databaseId,
            tableId: transactionsCollectionId,
            rowId: t2Id,
          })
          .catch(() => void 0);
      }
    });

    it("should cancel all RESERVED transactions for an item", async () => {
      // Seed 2 RESERVED transactions using repository.save to ensure proper ownership/permissions
      const res1Id = randomUUID();
      const res2Id = randomUUID();
      const localItemId = randomUUID();
      const { profileId, wishlistId } = await seedParentRecords(localItemId);
      const localUserId = "user-" + randomUUID().substring(0, 8);

      const t1 = Transaction.reconstitute({
        id: res1Id,
        itemId: localItemId,
        userId: localUserId,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const t2 = Transaction.reconstitute({
        id: res2Id,
        itemId: localItemId,
        userId: localUserId,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.save(t1);
      await repository.save(t2);

      try {
        // Wait for indices
        await vi.waitUntil(
          async () => {
            const results = await repository.findByItemId(localItemId);
            return results.length === 2;
          },
          { timeout: 5000, interval: 200 },
        );

        const cancelledCount = await repository.cancelByItemId(localItemId);
        expect(cancelledCount).toBe(2);

        const finalResults = await repository.findByItemId(localItemId);
        expect(
          finalResults.every(
            (r) => r.status === TransactionStatus.CANCELLED_BY_OWNER,
          ),
        ).toBe(true);
      } finally {
        await tablesDb
          .deleteRow({
            databaseId,
            tableId: transactionsCollectionId,
            rowId: res1Id,
          })
          .catch(() => void 0);
        await tablesDb
          .deleteRow({
            databaseId,
            tableId: transactionsCollectionId,
            rowId: res2Id,
          })
          .catch(() => void 0);
        await cleanupParentRecords(localItemId, wishlistId, profileId);
      }
    });

    it("should find transactions by userId", async () => {
      const localTransactionId = randomUUID();
      const localUserId = "user-" + randomUUID().substring(0, 8);
      const localItemId = randomUUID();

      const transaction = Transaction.reconstitute({
        id: localTransactionId,
        itemId: localItemId,
        userId: localUserId,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.save(transaction);

      try {
        await vi.waitUntil(
          async () => {
            const results = await repository.findByUserId(localUserId);
            return results.length === 1;
          },
          { timeout: 5000, interval: 200 },
        );

        const results = await repository.findByUserId(localUserId);
        expect(results).toHaveLength(1);
        expect(results[0].userId).toBe(localUserId);
      } finally {
        await tablesDb
          .deleteRow({
            databaseId,
            tableId: transactionsCollectionId,
            rowId: localTransactionId,
          })
          .catch(() => void 0);
      }
    });

    it("should delete a transaction", async () => {
      const localTransactionId = randomUUID();
      const localUserId = "user-" + randomUUID().substring(0, 8);
      const localItemId = randomUUID();

      const transaction = Transaction.reconstitute({
        id: localTransactionId,
        itemId: localItemId,
        userId: localUserId,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.save(transaction);

      // Verify it exists
      await vi.waitUntil(
        async () => {
          const res = await repository.findById(localTransactionId);
          return res !== null;
        },
        { timeout: 5000, interval: 200 },
      );

      const initial = await repository.findById(localTransactionId);
      expect(initial).not.toBeNull();

      await repository.delete(localTransactionId);

      const afterDelete = await repository.findById(localTransactionId);
      expect(afterDelete).toBeNull();
    });
  },
);
