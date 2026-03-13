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

// Mocks
const {
  mockGet,
  mockCreateAnonymousSession,
  mockGetRow,
  mockListRows,
  mockUpsertRow,
  mockUpdateRow,
  mockDeleteRow,
} = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockCreateAnonymousSession: vi.fn(),
  mockGetRow: vi.fn(),
  mockListRows: vi.fn(),
  mockUpsertRow: vi.fn(),
  mockUpdateRow: vi.fn(),
  mockDeleteRow: vi.fn(),
}));

// Mock Appwrite SDK
vi.mock("appwrite", async (importActual) => {
  const actual = await importActual<typeof import("appwrite")>();

  return {
    ...actual,
    Client: class {
      setEndpoint = vi.fn().mockReturnThis();
      setProject = vi.fn().mockReturnThis();
    },
    Account: class {
      get = mockGet;
      createAnonymousSession = mockCreateAnonymousSession;
    },
    TablesDB: class {
      getRow = mockGetRow;
      listRows = mockListRows;
      upsertRow = mockUpsertRow;
      updateRow = mockUpdateRow;
      deleteRow = mockDeleteRow;
    },
    Query: {
      equal: vi.fn((field: string, value: unknown) => ({
        field,
        value,
        type: "equal",
      })),
      limit: vi.fn((value: number) => ({ value, type: "limit" })),
      offset: vi.fn((value: number) => ({ value, type: "offset" })),
    },
  };
});

describe("AppwriteTransactionRepository", () => {
  let repository: AppwriteTransactionRepository;
  let mockClient: Client;

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
    repository = new TestAppwriteTransactionRepository(
      mockClient,
      config.databaseId,
      config.transactionsCollectionId,
    );
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
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);

      const result = await repository.resolveSession();

      expect(result).not.toBeNull();
      expect(result!.$id).toBe(validUserId);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it("should return null if account.get fails with 401", async () => {
      mockGet.mockRejectedValue(new AppwriteException("Unauthorized", 401));

      const result = await repository.resolveSession();

      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledTimes(1);
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

    it("should call resolveSession and upsert the transaction document", async () => {
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      mockUpsertRow.mockResolvedValue({} as MockRow);

      await repository.save(transaction);

      expect(mockGet).toHaveBeenCalled();
      expect(mockUpsertRow).toHaveBeenCalledWith({
        databaseId: config.databaseId,
        tableId: config.transactionsCollectionId,
        rowId: transaction.id,
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
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      mockGetRow.mockResolvedValue(mockDoc);

      const result = await repository.findById(validId);

      expect(result).toBeInstanceOf(Transaction);
      expect(result?.id).toBe(validId);
      expect(mockGet).toHaveBeenCalled();
    });

    it("should return null if not found (404)", async () => {
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      mockGetRow.mockRejectedValue(new AppwriteException("Not found", 404));

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
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      mockListRows.mockResolvedValue({
        rows: mockDocs,
        total: 1,
      } as MockRowList);

      const results = await repository.findByItemId(validItemId);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(validId);
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe("cancelByItemId", () => {
    it("should update all RESERVED transactions to CANCELLED_BY_OWNER", async () => {
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      mockListRows
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

      mockUpdateRow.mockResolvedValue({} as MockRow);

      const cancelledCount = await repository.cancelByItemId(validItemId);

      expect(cancelledCount).toBe(2);
      expect(mockGet).toHaveBeenCalled();
      expect(mockListRows).toHaveBeenCalledTimes(1);
      expect(mockUpdateRow).toHaveBeenCalledTimes(2);
      expect(mockUpdateRow).toHaveBeenCalledWith({
        databaseId: config.databaseId,
        tableId: config.transactionsCollectionId,
        rowId: "550e8400-e29b-41d4-a716-446655440004",
        data: { status: TransactionStatus.CANCELLED_BY_OWNER },
      });
      expect(mockUpdateRow).toHaveBeenCalledWith({
        databaseId: config.databaseId,
        tableId: config.transactionsCollectionId,
        rowId: "550e8400-e29b-41d4-a716-446655440005",
        data: { status: TransactionStatus.CANCELLED_BY_OWNER },
      });
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
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      mockListRows.mockResolvedValue({
        rows: mockDocs,
        total: 1,
      } as MockRowList);

      const results = await repository.findByUserId(validUserId);

      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe(validUserId);
      expect(mockGet).toHaveBeenCalled();
      expect(mockListRows).toHaveBeenCalledWith(
        expect.objectContaining({
          queries: expect.arrayContaining([
            expect.objectContaining({ field: "userId", value: validUserId }),
          ]),
        }),
      );
    });

    it("should allow filtering by status", async () => {
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      mockListRows.mockResolvedValue({
        rows: [],
        total: 0,
      } as MockRowList);

      await repository.findByUserId(validUserId, TransactionStatus.PURCHASED);

      expect(mockListRows).toHaveBeenCalledWith(
        expect.objectContaining({
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
      mockGet.mockResolvedValue({
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

      mockListRows
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
      expect(mockListRows).toHaveBeenCalledTimes(2);
      expect(mockListRows).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          queries: expect.arrayContaining([
            expect.objectContaining({ field: "userId", value: validUserId }),
            expect.objectContaining({ value: 100, type: "limit" }),
            expect.objectContaining({ value: 0, type: "offset" }),
          ]),
        }),
      );
      expect(mockListRows).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          queries: expect.arrayContaining([
            expect.objectContaining({ field: "userId", value: validUserId }),
            expect.objectContaining({ value: 100, type: "limit" }),
            expect.objectContaining({ value: 100, type: "offset" }),
          ]),
        }),
      );
    });

    it("should respect the limit parameter", async () => {
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);

      mockListRows.mockResolvedValue({
        rows: Array.from({ length: 20 }).map((_, i) =>
          createMockRow({ $sequence: i + 1 }),
        ),
        total: 20,
      } as MockRowList);

      const results = await repository.findByUserId(validUserId, undefined, 20);

      expect(results).toHaveLength(20);
      expect(mockListRows).toHaveBeenCalledWith(
        expect.objectContaining({
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
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      mockListRows.mockResolvedValue({
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
      expect(mockGet).toHaveBeenCalled();
      expect(mockListRows).toHaveBeenCalledWith(
        expect.objectContaining({
          queries: expect.arrayContaining([
            expect.objectContaining({ field: "userId", value: validUserId }),
            expect.objectContaining({ field: "itemId", value: validItemId }),
          ]),
        }),
      );
    });

    it("should allow filtering by status", async () => {
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      mockListRows.mockResolvedValue({
        rows: [],
        total: 0,
      } as MockRowList);

      await repository.findByUserIdAndItemId(
        validUserId,
        validItemId,
        TransactionStatus.PURCHASED,
      );

      expect(mockListRows).toHaveBeenCalledWith(
        expect.objectContaining({
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
      mockGet.mockResolvedValue({
        $id: "different-user",
      } as Models.User<Models.Preferences>);

      await expect(
        repository.findByUserIdAndItemId(validUserId, validItemId),
      ).rejects.toThrow(PersistenceError);

      expect(mockListRows).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should call resolveSession and delete the transaction", async () => {
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      mockDeleteRow.mockResolvedValue({} as Models.Document);

      await repository.delete(validId);

      expect(mockGet).toHaveBeenCalled();
      expect(mockDeleteRow).toHaveBeenCalledWith({
        databaseId: config.databaseId,
        tableId: config.transactionsCollectionId,
        rowId: validId,
      });
    });

    it("should handle 404 (silent success)", async () => {
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      mockDeleteRow.mockRejectedValue(new AppwriteException("Not found", 404));

      await expect(repository.delete(validId)).resolves.not.toThrow();
    });

    it("should rethrow non-404 errors", async () => {
      mockGet.mockResolvedValue({
        $id: validUserId,
      } as Models.User<Models.Preferences>);
      mockDeleteRow.mockRejectedValue(
        new AppwriteException("Internal Server Error", 500),
      );

      await expect(repository.delete(validId)).rejects.toThrow(
        PersistenceError,
      );
    });
  });
});
