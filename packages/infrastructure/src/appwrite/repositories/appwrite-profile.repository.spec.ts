/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-deprecated */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppwriteProfileRepository } from "./appwrite-profile.repository";
import {
  Client,
  TablesDB,
  AppwriteException,
  type Models,
} from "react-native-appwrite";
import { Profile } from "@wishin/domain";

// TablesDB specific types from Appwrite SDK
interface MockRow extends Models.Document {
  $tableId: string;
  $sequence: number;
  username: string;
  imageUrl: string;
  bio: string;
}

// Mock Appwrite SDK
vi.mock("react-native-appwrite", () => {
  const TablesDBMock = vi.fn();

  TablesDBMock.prototype.getRow = vi.fn();

  TablesDBMock.prototype.upsertRow = vi.fn();

  return {
    Client: class {
      setEndpoint = vi.fn().mockReturnThis();
      setProject = vi.fn().mockReturnThis();
    },
    TablesDB: TablesDBMock,
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

describe("AppwriteProfileRepository", () => {
  let repository: AppwriteProfileRepository;
  let mockTablesDb: InstanceType<typeof TablesDB>;

  const config = {
    databaseId: "db-id",
    profilesCollectionId: "profiles-id",
  };

  const validId = "00000000-0000-4000-a000-000000000001";

  class TestAppwriteProfileRepository extends AppwriteProfileRepository {
    public get tablesDbAccess(): InstanceType<typeof TablesDB> {
      return (this as unknown as { tablesDb: InstanceType<typeof TablesDB> })
        .tablesDb;
    }
  }

  beforeEach(() => {
    vi.resetAllMocks();
    const mockClient = new Client();
    const testRepo = new TestAppwriteProfileRepository(
      mockClient,
      config.databaseId,
      config.profilesCollectionId,
    );
    repository = testRepo;
    mockTablesDb = testRepo.tablesDbAccess;
  });

  describe("findById", () => {
    it("should return the profile if found", async () => {
      const mockDoc: MockRow = {
        $id: validId,
        username: "testuser",
        imageUrl: "https://example.com/image.jpg",
        bio: "Test bio",
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        $tableId: config.profilesCollectionId,
        $databaseId: config.databaseId,
        $collectionId: config.profilesCollectionId,
        $sequence: 1,
        $permissions: [],
      };
      vi.mocked(mockTablesDb.getRow).mockResolvedValue(mockDoc);

      const result = await repository.findById(validId);

      expect(result).toBeInstanceOf(Profile);
      expect(result?.id).toBe(validId);
      expect(result?.username).toBe("testuser");
    });

    it("should return null if not found (404)", async () => {
      vi.mocked(mockTablesDb.getRow).mockRejectedValue(
        new AppwriteException("Not found", 404),
      );

      const result = await repository.findById(validId);

      expect(result).toBeNull();
    });

    it("should rethrow non-404 errors", async () => {
      vi.mocked(mockTablesDb.getRow).mockRejectedValue(
        new AppwriteException("Internal Server Error", 500),
      );

      await expect(repository.findById(validId)).rejects.toThrow();
    });
  });

  describe("save", () => {
    it("should upsert the profile document", async () => {
      const profile = Profile.reconstitute({
        id: validId,
        username: "testuser",
        imageUrl: "https://example.com/image.jpg",
        bio: "Test bio",
      });
      vi.mocked(mockTablesDb.upsertRow).mockResolvedValue({} as MockRow);

      await repository.save(profile);

      expect(mockTablesDb.upsertRow).toHaveBeenCalledWith({
        databaseId: config.databaseId,
        tableId: config.profilesCollectionId,
        rowId: validId,

        data: expect.objectContaining({
          username: "testuser",
          imageUrl: "https://example.com/image.jpg",
          bio: "Test bio",
        }),
      });
    });
  });
});
