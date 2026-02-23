/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-deprecated */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppwriteWishlistRepository } from "./appwrite-wishlist.repository";
import { Client, Account, TablesDB, AppwriteException } from "appwrite";

// Mock Appwrite SDK
vi.mock("appwrite", () => {
  const Account = vi.fn();
  Account.prototype.get = vi.fn();
  Account.prototype.createAnonymousSession = vi.fn();

  const TablesDB = vi.fn();
  TablesDB.prototype.getRow = vi.fn();
  TablesDB.prototype.listRows = vi.fn();
  TablesDB.prototype.upsertRow = vi.fn();
  TablesDB.prototype.deleteRow = vi.fn();

  return {
    Client: class {
      setEndpoint = vi.fn().mockReturnThis();
      setProject = vi.fn().mockReturnThis();
    },
    Account,
    TablesDB,
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
  let repository: AppwriteWishlistRepository;
  let mockClient: Client;
  let mockAccount: InstanceType<typeof Account>;
  let mockTablesDb: InstanceType<typeof TablesDB>;

  const config = {
    databaseId: "db-id",
    wishlistCollectionId: "wishlists-id",
    wishlistItemsCollectionId: "items-id",
    transactionsCollectionId: "transactions-id",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = new Client();
    repository = new AppwriteWishlistRepository(
      mockClient,
      config.databaseId,
      config.wishlistCollectionId,
      config.wishlistItemsCollectionId,
      config.transactionsCollectionId,
    );

    // Access private properties for testing (type cast to any)
    mockAccount = (repository as any).account;
    mockTablesDb = (repository as any).tablesDb;
  });

  describe("ensureSession", () => {
    it("should do nothing if a session already exists (account.get succeeds)", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({} as any);

      await repository.ensureSession();

      expect(mockAccount.get).toHaveBeenCalledTimes(1);
      expect(mockAccount.createAnonymousSession).not.toHaveBeenCalled();
    });

    it("should create an anonymous session if account.get fails with 401", async () => {
      vi.mocked(mockAccount.get).mockRejectedValue(
        new AppwriteException("Unauthorized", 401),
      );
      vi.mocked(mockAccount.createAnonymousSession).mockResolvedValue(
        {} as any,
      );

      await repository.ensureSession();

      expect(mockAccount.get).toHaveBeenCalledTimes(1);
      expect(mockAccount.createAnonymousSession).toHaveBeenCalledTimes(1);
    });

    it("should rethrow if account.get fails with any other error", async () => {
      const error = new AppwriteException("Direct access forbidden", 403);
      vi.mocked(mockAccount.get).mockRejectedValue(error);

      await expect(repository.ensureSession()).rejects.toThrow(error);
      expect(mockAccount.createAnonymousSession).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should call ensureSession before deleting", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({} as any);
      vi.mocked(mockTablesDb.deleteRow).mockResolvedValue({} as any);

      await repository.delete("wishlist-id");

      expect(mockAccount.get).toHaveBeenCalled();
      expect(mockTablesDb.deleteRow).toHaveBeenCalledWith({
        databaseId: config.databaseId,
        tableId: config.wishlistCollectionId,
        rowId: "wishlist-id",
      });
    });

    it("should handle 404 error during deletion (silent success)", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({} as any);
      vi.mocked(mockTablesDb.deleteRow).mockRejectedValue(
        new AppwriteException("Not found", 404),
      );

      await expect(repository.delete("non-existent")).resolves.not.toThrow();
    });

    it("should rethrow non-404 errors during deletion", async () => {
      vi.mocked(mockAccount.get).mockResolvedValue({} as any);
      const error = new AppwriteException("Internal Server Error", 500);
      vi.mocked(mockTablesDb.deleteRow).mockRejectedValue(error);

      await expect(repository.delete("wishlist-id")).rejects.toThrow(error);
    });
  });
});
