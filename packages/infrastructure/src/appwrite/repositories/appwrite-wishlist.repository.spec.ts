/* eslint-disable @typescript-eslint/no-deprecated */
/* eslint-disable @typescript-eslint/unbound-method */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppwriteWishlistRepository } from "./appwrite-wishlist.repository";
import {
  Client,
  Account,
  TablesDB,
  AppwriteException,
  type Models,
} from "appwrite";
import {
  Wishlist,
  Visibility,
  Participation,
  Priority,
  PersistenceError,
} from "@wishin/domain";
import type { Logger, ObservabilityService } from "@wishin/domain";

// TablesDB specific types from Appwrite SDK
interface MockRow extends Models.Document {
  $tableId: string;
  $sequence: number;
  ownerId?: string;
  title?: string;
  itemId?: string | Models.Document;
  wishlistId?: string;
  name?: string;
  userId?: string;
  status?: string;
  priority?: string;
  totalQuantity?: number;
  reservedQuantity?: number;
  purchasedQuantity?: number;
  isUnlimited?: boolean;
  version?: number;
}

interface MockRowList {
  rows: MockRow[];
  total: number;
}

function isUpsertCall(
  arg: unknown,
): arg is { tableId: string; data: Record<string, unknown> } {
  return (
    typeof arg === "object" &&
    arg !== null &&
    "tableId" in arg &&
    "data" in arg &&
    typeof (arg as { data: unknown }).data === "object" &&
    (arg as { data: unknown }).data !== null
  );
}

// Mock Appwrite SDK
vi.mock("appwrite", () => {
  const get = vi.fn();
  const createAnonymousSession = vi.fn();
  const AccountMock = vi.fn().mockImplementation(function (this: Account) {
    this.get = get;
    this.createAnonymousSession = createAnonymousSession;
  });

  const getRow = vi.fn();
  const listRows = vi.fn();
  const upsertRow = vi.fn();
  const deleteRow = vi.fn();
  const TablesDBMock = vi.fn().mockImplementation(function (this: TablesDB) {
    this.getRow = getRow;
    this.listRows = listRows;
    this.upsertRow = upsertRow;
    this.deleteRow = deleteRow;
  });

  return {
    Client: class {
      setEndpoint = vi.fn().mockReturnThis();
      setProject = vi.fn().mockReturnThis();
    },
    Account: AccountMock,
    TablesDB: TablesDBMock,
    Query: {
      equal: vi.fn(),
      limit: vi.fn(),
      cursorAfter: vi.fn(),
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

describe("AppwriteWishlistRepository", () => {
  let repository: TestAppwriteWishlistRepository;
  let mockClient: Client;
  let mockAccount: Account;
  let mockTablesDb: TablesDB;

  const config = {
    databaseId: "db-id",
    wishlistCollectionId: "wishlists-id",
    wishlistItemsCollectionId: "items-id",
  };

  let mockLogger: Logger;
  let mockObservability: ObservabilityService;

  const mockUser = {
    $id: "user-123",
    email: "test@example.com",
  } as Models.User<Models.Preferences>;

  class TestAppwriteWishlistRepository extends AppwriteWishlistRepository {
    public get mockAccount() {
      return this.accountAccess;
    }
    public get mockTablesDb() {
      return this.tablesDbAccess;
    }
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = new Client();
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;
    mockObservability = {
      addBreadcrumb: vi.fn(),
      trackEvent: vi.fn(),
    } as unknown as ObservabilityService;

    repository = new TestAppwriteWishlistRepository(
      mockClient,
      config.databaseId,
      config.wishlistCollectionId,
      config.wishlistItemsCollectionId,
      "profiles",
      mockLogger,
      mockObservability,
    );

    mockAccount = repository.mockAccount;
    mockTablesDb = repository.mockTablesDb;
  });

  const createMockBase = (id: string, tableId: string): MockRow => ({
    $id: id,
    $tableId: tableId,
    $sequence: 1,
    $collectionId: tableId,
    $databaseId: config.databaseId,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    $permissions: [],
  });

  describe("resolveSession", () => {
    it("should return the user if account.get succeeds", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(mockUser);
      const result = await repository.resolveSession();
      expect(result).toEqual(mockUser);
      expect(mockAccount.createAnonymousSession).not.toHaveBeenCalled();
    });

    it("should return null if account.get fails with 401", async () => {
      vi.mocked(mockAccount.get).mockRejectedValueOnce(
        new AppwriteException("Unauthorized", 401),
      );
      const result = await repository.resolveSession();
      expect(result).toBeNull();
      expect(mockAccount.createAnonymousSession).not.toHaveBeenCalled();
    });

    it("should throw PersistenceError if account.get fails with any other error", async () => {
      const error = new Error("Other error");
      vi.mocked(mockAccount.get).mockRejectedValueOnce(error);

      await expect(repository.resolveSession()).rejects.toThrow(
        PersistenceError,
      );
    });
  });

  describe("delete", () => {
    it("should call resolveSession() before deleting", async () => {
      vi.mocked(mockAccount.get).mockResolvedValueOnce(mockUser);
      vi.mocked(mockTablesDb.deleteRow).mockResolvedValue(
        {} as Models.Document,
      ); // deleteRow returns a document in Appwrite SDK mock

      await repository.delete("wishlist-id");

      expect(mockAccount.get).toHaveBeenCalled();
      expect(mockTablesDb.deleteRow).toHaveBeenCalledWith({
        databaseId: config.databaseId,
        tableId: config.wishlistCollectionId,
        rowId: "wishlist-id",
      });
    });

    it("should handle 404 error during deletion (silent success)", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      vi.mocked(mockTablesDb.deleteRow).mockRejectedValueOnce(
        new AppwriteException("Not found", 404),
      );

      await expect(repository.delete("non-existent")).resolves.not.toThrow();
    });

    it("should rethrow non-404 errors during deletion", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      const error = new AppwriteException("Internal Server Error", 500);
      vi.mocked(mockTablesDb.deleteRow).mockRejectedValueOnce(error);

      await expect(
        repository.delete("550e8400-e29b-41d4-a716-446655440001"),
      ).rejects.toThrow(error);
    });
  });

  describe("save", () => {
    const mockWishlist = Wishlist.reconstitute({
      id: "550e8400-e29b-41d4-a716-446655440001",
      ownerId: "owner-id",
      title: "My Wishlist",
      visibility: Visibility.PRIVATE,
      participation: Participation.REGISTERED,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
      items: [
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          wishlistId: "550e8400-e29b-41d4-a716-446655440001",
          name: "Item 1",
          priority: Priority.MEDIUM,
          totalQuantity: 1,
          reservedQuantity: 0,
          purchasedQuantity: 0,
          isUnlimited: false,
        },
      ],
    });

    it("should call resolveSession() and sync items before saving the wishlist document", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(mockUser);
      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: [],
        total: 0,
      } as MockRowList);
      vi.mocked(mockTablesDb.getRow).mockRejectedValue(
        new AppwriteException("Not found", 404),
      );
      vi.mocked(mockTablesDb.upsertRow).mockResolvedValue(
        createMockBase("any", config.wishlistItemsCollectionId),
      );

      await repository.save(mockWishlist);

      expect(mockAccount.get).toHaveBeenCalled();
      // Ensure items are synced before the wishlist itself
      const upsertCalls = vi.mocked(mockTablesDb.upsertRow).mock.calls;
      expect(upsertCalls[0][0]).toEqual(
        expect.objectContaining({ tableId: config.wishlistItemsCollectionId }),
      );
      expect(upsertCalls[upsertCalls.length - 1][0]).toEqual(
        expect.objectContaining({ tableId: config.wishlistCollectionId }),
      );
    });

    it("should retry item sync on failure", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: [],
        total: 0,
      } as MockRowList);

      // Fail twice, then succeed
      vi.mocked(mockTablesDb.getRow).mockRejectedValue(
        new AppwriteException("Not found", 404),
      );
      vi.mocked(mockTablesDb.upsertRow)
        .mockRejectedValueOnce(new Error("Transient error"))
        .mockRejectedValueOnce(new Error("Transient error"))
        .mockResolvedValue(
          createMockBase("any", config.wishlistItemsCollectionId),
        );

      await repository.save(mockWishlist);

      // 1 initial + 2 retries = 3 calls for item-1
      const itemUpserts = vi
        .mocked(mockTablesDb.upsertRow)
        .mock.calls.filter(
          (c) =>
            isUpsertCall(c[0]) &&
            c[0].tableId === config.wishlistItemsCollectionId,
        );
      expect(itemUpserts.length).toBe(3);
    });

    it("should delete orphaned items", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: [
          {
            ...createMockBase(
              "550e8400-e29b-41d4-a716-446655440003",
              config.wishlistItemsCollectionId,
            ),
          },
        ],
        total: 1,
      } as MockRowList);
      vi.mocked(mockTablesDb.getRow).mockRejectedValue(
        new AppwriteException("Not found", 404),
      );
      vi.mocked(mockTablesDb.upsertRow).mockResolvedValue(
        createMockBase("any", config.wishlistItemsCollectionId),
      );
      vi.mocked(mockTablesDb.deleteRow).mockResolvedValue(
        {} as Models.Document,
      );

      await repository.save(mockWishlist);

      expect(mockTablesDb.deleteRow).toHaveBeenCalledWith({
        databaseId: config.databaseId,
        tableId: config.wishlistItemsCollectionId,
        rowId: "550e8400-e29b-41d4-a716-446655440003",
      });
    });

    it("should treat 404 errors during item deletion in save() as success (idempotency)", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: [
          {
            ...createMockBase(
              "550e8400-e29b-41d4-a716-446655440004",
              config.wishlistItemsCollectionId,
            ),
          },
        ],
        total: 1,
      } as MockRowList);
      vi.mocked(mockTablesDb.getRow).mockRejectedValue(
        new AppwriteException("Not found", 404),
      );
      vi.mocked(mockTablesDb.upsertRow).mockResolvedValue(
        createMockBase("any", config.wishlistItemsCollectionId),
      );
      vi.mocked(mockTablesDb.deleteRow).mockRejectedValue(
        new AppwriteException("Not found", 404),
      );

      await expect(repository.save(mockWishlist)).resolves.not.toThrow();

      expect(mockTablesDb.deleteRow).toHaveBeenCalledWith({
        databaseId: config.databaseId,
        tableId: config.wishlistItemsCollectionId,
        rowId: "550e8400-e29b-41d4-a716-446655440004",
      });
    });

    it("should throw error on concurrency conflict during saving", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      const conflictDoc = {
        ...createMockBase(mockWishlist.id, config.wishlistCollectionId),
        version: 5, // different from expected 0
      };
      vi.mocked(mockTablesDb.getRow).mockResolvedValue(conflictDoc);

      await expect(repository.save(mockWishlist)).rejects.toThrow(
        /Concurrency conflict/,
      );
    });

    it("should throw error when saving a new wishlist with version != 0", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      vi.mocked(mockTablesDb.getRow).mockRejectedValue(
        new AppwriteException("Not found", 404),
      );

      const invalidNewWishlist = Wishlist.reconstitute({
        ...mockWishlist.toProps(),
        version: 1, // Invalid for a "new" wishlist
        items: [],
      });

      await expect(repository.save(invalidNewWishlist)).rejects.toThrow(
        /Validation error \(TOCTOU\): New wishlist.*must have version 0/,
      );
    });

    it("should throw TOCTOU error if version changes between check and write and prevent mutations", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: [],
        total: 0,
      } as MockRowList);

      // Return a version that will cause a conflict (should be wishlist.version - 1)
      // Wishlist version is 1, so it expects 0 in DB.
      vi.mocked(mockTablesDb.getRow).mockResolvedValue({
        ...createMockBase(mockWishlist.id, config.wishlistCollectionId),
        version: 5, // Changed by another process!
      } as unknown as Models.Row);

      const wishlistToUpdate = Wishlist.reconstitute({
        ...mockWishlist.toProps(),
        version: 1, // Updating to 1
        items: [
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            wishlistId: mockWishlist.id,
            name: "Item 1",
            priority: Priority.MEDIUM,
            totalQuantity: 1,
            reservedQuantity: 0,
            purchasedQuantity: 0,
            isUnlimited: false,
          },
        ],
      });

      await expect(repository.save(wishlistToUpdate)).rejects.toThrow(
        /Concurrency conflict \(TOCTOU\)/,
      );

      // Verify that item sync was NEVER called because the conflict check happened first
      expect(mockTablesDb.upsertRow).not.toHaveBeenCalled();
      expect(mockTablesDb.deleteRow).not.toHaveBeenCalled();
    });
    it("should perform internal compensation if wishlist upsert fails", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );

      const updatingWishlist = Wishlist.reconstitute({
        ...mockWishlist.toProps(),
        items: mockWishlist.items.map((i) => i.toProps()),
        version: 1, // Updating from 0 to 1
      });

      // 1. Mock existing items in DB
      const existingItemId = "00000000-0000-4000-8000-000000000002";
      const existingItem = {
        ...createMockBase(existingItemId, config.wishlistItemsCollectionId),
        name: "Old Name",
      };
      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: [existingItem],
        total: 1,
      } as MockRowList);

      // 2. Mock version check success
      vi.mocked(mockTablesDb.getRow).mockResolvedValue({
        ...createMockBase(updatingWishlist.id, config.wishlistCollectionId),
        version: 0,
      } as MockRow);

      // 3. Mock wishlist upsert failure
      const upsertError = new Error("Final upsert failed");
      vi.mocked(mockTablesDb.upsertRow)
        .mockResolvedValueOnce(existingItem) // Item 1 sync
        .mockRejectedValueOnce(upsertError) // Wishlist header sync (fails)
        .mockResolvedValueOnce(existingItem); // Compensation restore (succeeds)

      await expect(repository.save(updatingWishlist)).rejects.toThrow(
        upsertError,
      );

      // 4. Verify compensation
      // We expect upsertRow to be called for:
      // - Initial item sync (item 1)
      // - Wishlist header (fails)
      // - Restoration of existing items (compensation)

      const itemUpserts = vi
        .mocked(mockTablesDb.upsertRow)
        .mock.calls.filter(
          (c) =>
            isUpsertCall(c[0]) &&
            c[0].tableId === config.wishlistItemsCollectionId,
        );

      // At least 2 calls for items: initial sync and compensation restore
      expect(itemUpserts.length).toBeGreaterThanOrEqual(2);

      // Specifically check that the original item state was restored
      const restoreCall = itemUpserts.find(
        (c) =>
          isUpsertCall(c[0]) &&
          (c[0].data as { name: string }).name === "Old Name",
      );
      expect(restoreCall).toBeDefined();

      // Verify that the newly created item was deleted during compensation
      expect(mockTablesDb.deleteRow).toHaveBeenCalledWith(
        expect.objectContaining({
          tableId: config.wishlistItemsCollectionId,
          rowId: "550e8400-e29b-41d4-a716-446655440002",
        }),
      );
    });
  });
  describe("findById", () => {
    const validId = "550e8400-e29b-41d4-a716-446655440003";
    const mockDoc = {
      ...createMockBase(validId, config.wishlistCollectionId),
      ownerId: "owner-id",
      title: "My Wishlist",
    } satisfies MockRow;

    it("should call resolveSession by default", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      vi.mocked(mockTablesDb.getRow).mockResolvedValue(mockDoc);
      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: [],
        total: 0,
      } as MockRowList);

      await repository.findById(validId);

      expect(mockAccount.get).toHaveBeenCalledTimes(1);
    });
  });

  describe("findByOwnerId", () => {
    const validId = "550e8400-e29b-41d4-a716-446655440003";
    const mockDoc = {
      ...createMockBase(validId, config.wishlistCollectionId),
      ownerId: "owner-id",
      title: "My Wishlist",
    } satisfies MockRow;

    it("should call resolveSession and findById correctly", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue(
        {} as Models.User<Models.Preferences>,
      );
      vi.mocked(mockTablesDb.listRows).mockResolvedValue({
        rows: [mockDoc],
        total: 1,
      } as MockRowList);
      vi.mocked(mockTablesDb.getRow).mockResolvedValue(mockDoc);
      // Also mock listRows for the item fetch inside findById
      vi.mocked(mockTablesDb.listRows).mockReset();
      vi.mocked(mockTablesDb.listRows)
        .mockResolvedValueOnce({
          rows: [mockDoc], // Outer call
          total: 1,
        } as MockRowList)
        .mockResolvedValueOnce({
          rows: [
            {
              ...createMockBase(
                "550e8400-e29b-41d4-a716-446655440099",
                config.wishlistItemsCollectionId,
              ),
              wishlistId: validId,
              name: "Item 1",
              priority: "medium",
              totalQuantity: 1,
              reservedQuantity: 0,
              purchasedQuantity: 0,
              isUnlimited: false,
            },
          ],
          total: 1,
        } as MockRowList);

      const findByIdSpy = vi.spyOn(repository, "findById");

      await repository.findByOwnerId("owner-id");

      expect(mockAccount.get).toHaveBeenCalled();
      expect(findByIdSpy).toHaveBeenCalledWith(mockDoc.$id, true);
      // Calls: 1 in findByOwnerId (list wishlists), 1 in findById (list items)
      expect(mockTablesDb.listRows).toHaveBeenCalledTimes(2);
      // Assert hydration via internal findById calls by checking getRow
      expect(mockTablesDb.getRow).toHaveBeenCalledWith(
        expect.objectContaining({
          databaseId: config.databaseId,
          tableId: config.wishlistCollectionId,
          rowId: mockDoc.$id,
        }),
      );

      findByIdSpy.mockRestore();
    });
  });

  describe("getSessionType", () => {
    it("should return 'anonymous' when user has no email", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: "guest-id",
        email: "",
      } as Models.User<Models.Preferences>);

      const type = await repository.getSessionType();

      expect(type).toBe("anonymous");
      expect(mockTablesDb.getRow).not.toHaveBeenCalled();
    });

    it("should return 'registered' when user has email and profile exists", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: "user-id",
        email: "user@example.com",
      } as Models.User<Models.Preferences>);
      vi.mocked(mockTablesDb.getRow).mockResolvedValue({
        $id: "user-id",
      } as MockRow);

      const type = await repository.getSessionType();

      expect(type).toBe("registered");
      expect(mockTablesDb.getRow).toHaveBeenCalledWith({
        databaseId: config.databaseId,
        tableId: "profiles",
        rowId: "user-id",
      });
    });

    it("should return 'incomplete' when user has email but profile does not exist (404)", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: "user-id",
        email: "user@example.com",
      } as Models.User<Models.Preferences>);
      vi.mocked(mockTablesDb.getRow).mockRejectedValueOnce(
        new AppwriteException("Not found", 404),
      );

      const type = await repository.getSessionType();

      expect(type).toBe("incomplete");
    });

    it("should rethrow non-404 errors during profile check", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({
        $id: "user-id",
        email: "user@example.com",
      } as Models.User<Models.Preferences>);
      const error = new AppwriteException("Internal Server Error", 500);
      vi.mocked(mockTablesDb.getRow).mockRejectedValueOnce(error);

      await expect(repository.getSessionType()).rejects.toThrow(error);
    });
  });
});
