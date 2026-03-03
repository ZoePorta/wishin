/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-deprecated */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppwriteTransactionRepository } from "./appwrite-transaction.repository";
import {
  Client,
  Account,
  TablesDB,
  AppwriteException,
  type Models,
} from "appwrite";
import { Transaction, TransactionStatus } from "@wishin/domain";

// TablesDB specific types from Appwrite SDK
interface MockRow extends Models.Document {
  $tableId: string;
  $sequence: number;
  itemId?: string;
  userId?: string;
  status?: TransactionStatus;
  quantity?: number;
}

interface MockRowList {
  rows: MockRow[];
  total: number;
}

// Mock Appwrite SDK
vi.mock("appwrite", () => {
  const Account = vi.fn();
  Account.prototype.get = vi.fn();
  Account.prototype.createAnonymousSession = vi.fn();

  const TablesDB = vi.fn();
  TablesDB.prototype.getRow = vi.fn();
  TablesDB.prototype.listRows = vi.fn();
  TablesDB.prototype.upsertRow = vi.fn();
  TablesDB.prototype.updateRow = vi.fn();

  return {
    Client: class {
      setEndpoint = vi.fn().mockReturnThis();
      setProject = vi.fn().mockReturnThis();
    },
    Account,
    TablesDB,
    Query: {
      equal: vi.fn((field, value) => ({ field, value, type: "equal" })),
      limit: vi.fn((value) => ({ value, type: "limit" })),
    },
    AppwriteException: class extends Error {
      constructor(
        message: string,
        public code?: number,
        public type?: string,
      ) {
        super(message);
        this.name = "AppwriteException";
      }
    },
  };
});

describe("AppwriteTransactionRepository", () => {
  let repository: AppwriteTransactionRepository;
  let mockClient: Client;
  let mockAccount: InstanceType<typeof Account>;
  let mockTablesDb: InstanceType<typeof TablesDB>;

  const config = {
    databaseId: "db-id",
    transactionsCollectionId: "transactions-id",
  };

  const validId = "550e8400-e29b-41d4-a716-446655440001";
  const validItemId = "550e8400-e29b-41d4-a716-446655440002";
  const validUserId = "550e8400-e29b-41d4-a716-446655440003";

  class TestAppwriteTransactionRepository extends AppwriteTransactionRepository {
    public get accountAccess(): InstanceType<typeof Account> {
      return (this as unknown as { account: InstanceType<typeof Account> })
        .account;
    }
    public get tablesDbAccess(): InstanceType<typeof TablesDB> {
      return (this as unknown as { tablesDb: InstanceType<typeof TablesDB> })
        .tablesDb;
    }
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = new Client();
    const testRepo = new TestAppwriteTransactionRepository(
      mockClient,
      config.databaseId,
      config.transactionsCollectionId,
    );
    repository = testRepo;
    mockAccount = testRepo.accountAccess;
    mockTablesDb = testRepo.tablesDbAccess;
  });

  describe("ensureSession", () => {
    it("should do nothing if a session already exists (account.get succeeds)", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );

      await repository.ensureSession();

      expect(mockAccount.get).toHaveBeenCalledTimes(1);
      expect(mockAccount.createAnonymousSession).not.toHaveBeenCalled();
    });

    it("should create an anonymous session if account.get fails with 401", async () => {
      vi.mocked(mockAccount.get).mockRejectedValue(
        new AppwriteException("Unauthorized", 401),
      );
      vi.mocked(mockAccount.createAnonymousSession).mockResolvedValue(
        {} as Models.Session,
      );

      await repository.ensureSession();

      expect(mockAccount.get).toHaveBeenCalledTimes(1);
      expect(mockAccount.createAnonymousSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("save", () => {
    const transaction = Transaction.reconstitute({
      id: validId,
      itemId: validItemId,
      userId: validUserId,
      status: TransactionStatus.RESERVED,
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it("should call ensureSession and upsert the transaction document", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      vi.mocked(mockTablesDb.upsertRow).mockResolvedValue({} as MockRow);

      await repository.save(transaction);

      expect(mockAccount.get).toHaveBeenCalled();
      expect(mockTablesDb.upsertRow).toHaveBeenCalledWith({
        databaseId: config.databaseId,
        tableId: config.transactionsCollectionId,
        rowId: transaction.id,
        data: expect.objectContaining({
          itemId: transaction.itemId,
          userId: transaction.userId,
          status: transaction.status,
          quantity: transaction.quantity,
        }),
      });
    });
  });

  describe("findById", () => {
    const mockDoc = {
      $id: validId,
      itemId: validItemId,
      userId: validUserId,
      status: TransactionStatus.RESERVED,
      quantity: 1,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      $permissions: [],
      $databaseId: config.databaseId,
      $collectionId: config.transactionsCollectionId,
      $tableId: config.transactionsCollectionId,
      $sequence: 1,
    } as MockRow;

    it("should return the transaction if found", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      vi.mocked(mockTablesDb.getRow).mockResolvedValue(mockDoc);

      const result = await repository.findById(validId);

      expect(result).toBeInstanceOf(Transaction);
      expect(result?.id).toBe(validId);
      expect(mockAccount.get).toHaveBeenCalled();
    });

    it("should return null if not found (404)", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      vi.mocked(mockTablesDb.getRow).mockRejectedValue(
        new AppwriteException("Not found", 404),
      );

      const result = await repository.findById(validId);

      expect(result).toBeNull();
    });
  });

  describe("findByItemId", () => {
    const mockDocs: MockRow[] = [
      {
        $id: validId,
        itemId: validItemId,
        userId: validUserId,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        $permissions: [],
        $databaseId: config.databaseId,
        $collectionId: config.transactionsCollectionId,
        $tableId: config.transactionsCollectionId,
        $sequence: 1,
      },
    ];

    it("should return list of transactions for an item", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: mockDocs,
        total: 1,
      } as MockRowList);

      const results = await repository.findByItemId(validItemId);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(validId);
      expect(mockAccount.get).toHaveBeenCalled();
    });
  });

  describe("cancelByItemId", () => {
    it("should update all RESERVED transactions to CANCELLED_BY_OWNER", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      vi.mocked(mockTablesDb.listRows)
        .mockResolvedValueOnce({
          rows: [
            {
              $id: "550e8400-e29b-41d4-a716-446655440004",
              status: TransactionStatus.RESERVED,
              itemId: validItemId,
              userId: validUserId,
              quantity: 1,
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString(),
              $permissions: [],
              $databaseId: config.databaseId,
              $collectionId: config.transactionsCollectionId,
              $tableId: config.transactionsCollectionId,
              $sequence: 1,
            } as MockRow,
            {
              $id: "550e8400-e29b-41d4-a716-446655440005",
              status: TransactionStatus.RESERVED,
              itemId: validItemId,
              userId: validUserId,
              quantity: 1,
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString(),
              $permissions: [],
              $databaseId: config.databaseId,
              $collectionId: config.transactionsCollectionId,
              $tableId: config.transactionsCollectionId,
              $sequence: 2,
            } as MockRow,
          ],
          total: 2,
        } as MockRowList)
        .mockResolvedValueOnce({
          rows: [],
          total: 0,
        } as MockRowList);

      vi.mocked(mockTablesDb.updateRow).mockResolvedValue({} as MockRow);

      const cancelledCount = await repository.cancelByItemId(validItemId);

      expect(cancelledCount).toBe(2);
      expect(mockAccount.get).toHaveBeenCalled();
      expect(mockTablesDb.updateRow).toHaveBeenCalledTimes(2);
    });
  });
});
