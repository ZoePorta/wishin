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

      repository = new AppwriteTransactionRepository(
        client,
        databaseId,
        transactionsCollectionId,
      );
    });

    const transactionId = randomUUID();
    const itemId = randomUUID();
    const userId = randomUUID();

    afterEach(async () => {
      await tablesDb
        .deleteRow({
          databaseId,
          tableId: transactionsCollectionId,
          rowId: transactionId,
        })
        .catch(() => void 0);
    });

    it("should save and find a transaction by id", async () => {
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

    it("should find transactions by itemId", async () => {
      // Seed another transaction for the same item
      const t2Id = randomUUID();
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
            return results.length >= 1;
          },
          { timeout: 5000, interval: 200 },
        );

        const results = await repository.findByItemId(itemId);
        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results.some((r) => r.itemId === itemId)).toBe(true);
      } finally {
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
      // Seed 2 RESERVED transactions
      const res1Id = randomUUID();
      const res2Id = randomUUID();
      const localItemId = randomUUID();

      await Promise.all([
        tablesDb.createRow({
          databaseId,
          tableId: transactionsCollectionId,
          rowId: res1Id,
          data: {
            itemId: localItemId,
            userId: userId,
            status: TransactionStatus.RESERVED,
            quantity: 1,
          },
        }),
        tablesDb.createRow({
          databaseId,
          tableId: transactionsCollectionId,
          rowId: res2Id,
          data: {
            itemId: localItemId,
            userId: userId,
            status: TransactionStatus.RESERVED,
            quantity: 1,
          },
        }),
      ]);

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
      }
    });
  },
);
