/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-deprecated */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppwriteTransactionRepository } from "./appwrite-transaction.repository";
import {
  Client,
  Account,
  TablesDB,
  AppwriteException,
  type Models,
} from "appwrite";
import {
  Transaction,
  TransactionStatus,
  PersistenceError,
} from "@wishin/domain";

// TablesDB specific types from Appwrite SDK
interface MockRow extends Models.Document {
  $tableId: string;
  $sequence: number;
  itemId?: string;
  userId?: string;
  itemName?: string | null;
  itemPrice?: number | null;
  itemCurrency?: string | null;
  itemDescription?: string | null;
  ownerUsername?: string | null;
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  Account.prototype.get = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  Account.prototype.createAnonymousSession = vi.fn();

  const TablesDB = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  TablesDB.prototype.getRow = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  TablesDB.prototype.listRows = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  TablesDB.prototype.upsertRow = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  TablesDB.prototype.updateRow = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  TablesDB.prototype.deleteRow = vi.fn();

  return {
    Client: class {
      setEndpoint = vi.fn().mockReturnThis();
      setProject = vi.fn().mockReturnThis();
    },
    Account,
    TablesDB,
    Query: {
      equal: vi.fn((field: string, value: unknown) => ({
        field,
        value,
        type: "equal",
      })),
      limit: vi.fn((value: number) => ({ value, type: "limit" })),
      offset: vi.fn((value: number) => ({ value, type: "offset" })),
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
  const validUserId = "user-123";

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
    vi.resetAllMocks();
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

  function createMockRow(overrides: Partial<MockRow> = {}): MockRow {
    return {
      $id: validId,
      itemId: validItemId,
      userId: validUserId,
      itemName: "Test Item",
      itemPrice: 99.99,
      itemCurrency: "EUR",
      itemDescription: "A test item description",
      ownerUsername: "testuser",
      status: TransactionStatus.RESERVED,
      quantity: 1,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      $permissions: [],
      $databaseId: config.databaseId,
      $collectionId: config.transactionsCollectionId,
      $tableId: config.transactionsCollectionId,
      $sequence: 1,
      ...overrides,
    } as MockRow;
  }

  describe("resolveSession", () => {
    it("should return the user if account.get succeeds", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);

      const result = await repository.resolveSession();

      expect(result?.$id).toBe(validUserId);
      expect(mockAccount.get).toHaveBeenCalledTimes(1);
    });

    it("should return null if account.get fails with 401", async () => {
      vi.mocked(mockAccount.get).mockRejectedValue(
        new AppwriteException("Unauthorized", 401),
      );

      const result = await repository.resolveSession();

      expect(result).toBeNull();
      expect(mockAccount.get).toHaveBeenCalledTimes(1);
    });
  });

  describe("save", () => {
    const transaction = Transaction.reconstitute({
      id: validId,
      itemId: validItemId,
      userId: validUserId,
      itemName: "Test Item",
      itemPrice: 99.99,
      itemCurrency: "EUR",
      itemDescription: "A test item description",
      ownerUsername: "testuser",
      status: TransactionStatus.RESERVED,
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it("should call ensureSession and upsert the transaction document", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      vi.mocked(mockTablesDb.upsertRow).mockResolvedValue({} as MockRow);

      await repository.save(transaction);

      expect(mockAccount.get).toHaveBeenCalled();
      expect(mockTablesDb.upsertRow).toHaveBeenCalledWith({
        databaseId: config.databaseId,
        tableId: config.transactionsCollectionId,
        rowId: transaction.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          itemId: transaction.itemId,
          userId: transaction.userId,
          itemName: transaction.itemName,
          itemPrice: transaction.itemPrice,
          itemCurrency: transaction.itemCurrency,
          itemDescription: transaction.itemDescription,
          ownerUsername: transaction.ownerUsername,
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
      itemName: "Test Item",
      itemPrice: 99.99,
      itemCurrency: "EUR",
      itemDescription: "A test item description",
      ownerUsername: "testuser",
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
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      vi.mocked(mockTablesDb.getRow).mockResolvedValue(mockDoc);

      const result = await repository.findById(validId);

      expect(result).toBeInstanceOf(Transaction);
      expect(result?.id).toBe(validId);
      expect(mockAccount.get).toHaveBeenCalled();
    });

    it("should return null if not found (404)", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
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
        itemName: "Test Item",
        itemPrice: 99.99,
        itemCurrency: "EUR",
        itemDescription: "A test item description",
        ownerUsername: "testuser",
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
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
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
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      vi.mocked(mockTablesDb.listRows)
        .mockResolvedValueOnce({
          rows: [
            {
              $id: "550e8400-e29b-41d4-a716-446655440004",
              status: TransactionStatus.RESERVED,
              itemId: validItemId,
              userId: validUserId,
              itemName: "Test Item 4",
              itemPrice: 44.44,
              itemCurrency: "EUR",
              itemDescription: "Description 4",
              ownerUsername: "testuser",
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
              itemName: "Test Item 5",
              itemPrice: 55.55,
              itemCurrency: "EUR",
              itemDescription: "Description 5",
              ownerUsername: "testuser",
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

  describe("findByUserId", () => {
    const mockDocs: MockRow[] = [
      {
        $id: validId,
        itemId: validItemId,
        userId: validUserId,
        itemName: "Test Item",
        itemPrice: 99.99,
        itemCurrency: "EUR",
        itemDescription: "A test item description",
        ownerUsername: "testuser",
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

    it("should return transactions for a user", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: mockDocs,
        total: 1,
      } as MockRowList);

      const results = await repository.findByUserId(validUserId);

      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe(validUserId);
      expect(mockAccount.get).toHaveBeenCalled();
      expect(mockTablesDb.listRows).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          queries: expect.arrayContaining([
            expect.objectContaining({ field: "userId", value: validUserId }),
          ]),
        }),
      );
    });

    it("should allow filtering by status", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: [],
        total: 0,
      } as MockRowList);

      await repository.findByUserId(validUserId, TransactionStatus.PURCHASED);

      expect(mockTablesDb.listRows).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          queries: expect.arrayContaining([
            expect.objectContaining({ field: "userId", value: validUserId }),
            expect.objectContaining({
              field: "status",
              value: TransactionStatus.PURCHASED,
            }),
          ]),
        }),
      );
    });

    it("should aggregate all pages when there are more than 100 results", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);

      // Page 1: 100 docs
      const page1Docs = Array(100)
        .fill(null)
        .map((_, i) => ({
          $id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, "0")}`,
          itemId: validItemId,
          userId: validUserId,
          itemName: `Item ${String(i)}`,
          itemPrice: 10 + i,
          itemCurrency: "EUR",
          itemDescription: `Description ${String(i)}`,
          ownerUsername: "testuser",
          status: TransactionStatus.RESERVED,
          quantity: 1,
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString(),
          $permissions: [],
          $databaseId: config.databaseId,
          $collectionId: config.transactionsCollectionId,
          $tableId: config.transactionsCollectionId,
          $sequence: i + 1,
        }));

      // Page 2: 5 docs
      const page2Docs = Array(5)
        .fill(null)
        .map((_, i) => ({
          $id: `550e8400-e29b-41d4-a716-44665545${String(i).padStart(4, "0")}`,
          itemId: validItemId,
          userId: validUserId,
          itemName: `Item ${String(100 + i)}`,
          itemPrice: 110 + i,
          itemCurrency: "EUR",
          itemDescription: `Description ${String(100 + i)}`,
          ownerUsername: "testuser",
          status: TransactionStatus.RESERVED,
          quantity: 1,
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString(),
          $permissions: [],
          $databaseId: config.databaseId,
          $collectionId: config.transactionsCollectionId,
          $tableId: config.transactionsCollectionId,
          $sequence: 101 + i,
        }));

      vi.mocked(mockTablesDb.listRows)
        .mockResolvedValueOnce({
          rows: page1Docs,
          total: 105,
        } as MockRowList)
        .mockResolvedValueOnce({
          rows: page2Docs,
          total: 105,
        } as MockRowList);

      const results = await repository.findByUserId(validUserId);

      expect(results).toHaveLength(105);
      expect(mockTablesDb.listRows).toHaveBeenCalledTimes(2);
      expect(mockTablesDb.listRows).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          queries: expect.arrayContaining([
            expect.objectContaining({ field: "userId", value: validUserId }),
            expect.objectContaining({ value: 100, type: "limit" }),
            expect.objectContaining({ value: 0, type: "offset" }),
          ]),
        }),
      );
      expect(mockTablesDb.listRows).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          queries: expect.arrayContaining([
            expect.objectContaining({ field: "userId", value: validUserId }),
            expect.objectContaining({ value: 100, type: "limit" }),
            expect.objectContaining({ value: 100, type: "offset" }),
          ]),
        }),
      );
    });

    it("should respect the limit parameter", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);

      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: Array.from({ length: 20 }).map((_, i) =>
          createMockRow({ $sequence: i + 1 }),
        ),
        total: 20,
      } as MockRowList);

      const results = await repository.findByUserId(validUserId, undefined, 20);

      expect(results).toHaveLength(20);
      expect(mockTablesDb.listRows).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          queries: expect.arrayContaining([
            expect.objectContaining({ value: 20, type: "limit" }),
          ]),
        }),
      );
    });
  });

  describe("findByUserIdAndItemId", () => {
    const mockDocs: MockRow[] = [
      {
        $id: validId,
        itemId: validItemId,
        userId: validUserId,
        itemName: "Test Item",
        itemPrice: 99.99,
        itemCurrency: "EUR",
        itemDescription: "A test item description",
        ownerUsername: "testuser",
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

    it("should return transactions for a user and item", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: mockDocs,
        total: 1,
      } as MockRowList);

      const results = await repository.findByUserIdAndItemId(
        validUserId,
        validItemId,
      );

      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe(validUserId);
      expect(results[0].itemId).toBe(validItemId);
      expect(mockAccount.get).toHaveBeenCalled();
      expect(mockTablesDb.listRows).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          queries: expect.arrayContaining([
            expect.objectContaining({ field: "userId", value: validUserId }),
            expect.objectContaining({ field: "itemId", value: validItemId }),
          ]),
        }),
      );
    });

    it("should allow filtering by status", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: [],
        total: 0,
      } as MockRowList);

      await repository.findByUserIdAndItemId(
        validUserId,
        validItemId,
        TransactionStatus.PURCHASED,
      );

      expect(mockTablesDb.listRows).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          queries: expect.arrayContaining([
            expect.objectContaining({ field: "userId", value: validUserId }),
            expect.objectContaining({ field: "itemId", value: validItemId }),
            expect.objectContaining({
              field: "status",
              value: TransactionStatus.PURCHASED,
            }),
          ]),
        }),
      );
    });

    it("should throw PersistenceError if userId does not match authenticated user", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: "different-user",
      } as Models.User<Models.Preferences>);

      await expect(
        repository.findByUserIdAndItemId(validUserId, validItemId),
      ).rejects.toThrow(PersistenceError);

      expect(mockTablesDb.listRows).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should call ensureSession and delete the transaction", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      vi.mocked(mockTablesDb.deleteRow).mockResolvedValue(
        {} as Models.Document,
      );

      await repository.delete(validId);

      expect(mockAccount.get).toHaveBeenCalled();
      expect(mockTablesDb.deleteRow).toHaveBeenCalledWith({
        databaseId: config.databaseId,
        tableId: config.transactionsCollectionId,
        rowId: validId,
      });
    });

    it("should handle 404 (silent success)", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      vi.mocked(mockTablesDb.deleteRow).mockRejectedValue(
        new AppwriteException("Not found", 404),
      );

      await expect(repository.delete(validId)).resolves.not.toThrow();
    });

    it("should rethrow non-404 errors", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      vi.mocked(mockTablesDb.deleteRow).mockRejectedValue(
        new AppwriteException("Internal Server Error", 500),
      );

      await expect(repository.delete(validId)).rejects.toThrow();
    });
  });
});
