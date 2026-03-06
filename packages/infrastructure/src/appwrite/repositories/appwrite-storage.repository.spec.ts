import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppwriteStorageRepository } from "./appwrite-storage.repository";
import { Client, type Models } from "appwrite";

// Share mocks using vi.hoisted
const { get, createAnonymousSession, createFile, deleteFile, getFilePreview } =
  vi.hoisted(() => ({
    get: vi.fn(),
    createAnonymousSession: vi.fn(),
    createFile: vi.fn(),
    deleteFile: vi.fn(),
    getFilePreview: vi.fn(),
  }));

// Mock Appwrite SDK
vi.mock("appwrite", () => {
  const AccountMock = vi.fn().mockImplementation(function () {
    return {
      get,
      createAnonymousSession,
    };
  });

  const StorageMock = vi.fn().mockImplementation(function () {
    return {
      createFile,
      deleteFile,
      getFilePreview,
    };
  });

  return {
    Client: vi.fn().mockImplementation(function () {
      return {
        setEndpoint: vi.fn().mockReturnThis(),
        setProject: vi.fn().mockReturnThis(),
      };
    }),
    Account: AccountMock,
    Storage: StorageMock,
    ID: { unique: () => "unique-id" },
    AppwriteException: class extends Error {
      constructor(
        public message: string,
        public code: number,
      ) {
        super(message);
      }
    },
  };
});

describe("AppwriteStorageRepository", () => {
  let client: Client;
  let repository: AppwriteStorageRepository;
  const bucketId = "test-bucket";

  beforeEach(() => {
    vi.clearAllMocks();
    client = new Client();
    repository = new AppwriteStorageRepository(client, bucketId);
  });

  describe("ensureSession", () => {
    it("should return user if session exists", async () => {
      const mockUser = { $id: "user-123" };
      get.mockResolvedValue(
        mockUser as unknown as Models.User<Models.Preferences>,
      );

      const user = await repository.ensureSession();

      expect(user).toEqual(mockUser);
      expect(get).toHaveBeenCalled();
    });

    it("should create anonymous session if 401 error occurs", async () => {
      const mockUser = { $id: "user-123" };
      get
        .mockRejectedValueOnce({ code: 401 })
        .mockResolvedValueOnce(
          mockUser as unknown as Models.User<Models.Preferences>,
        );

      const user = await repository.ensureSession();

      expect(user).toEqual(mockUser);
      expect(createAnonymousSession).toHaveBeenCalled();
      expect(get).toHaveBeenCalledTimes(2);
    });
  });

  describe("getCurrentUserId", () => {
    it("should return current user ID", async () => {
      const mockUser = { $id: "user-123" };
      get.mockResolvedValue(
        mockUser as unknown as Models.User<Models.Preferences>,
      );

      const userId = await repository.getCurrentUserId();

      expect(userId).toBe("user-123");
      expect(get).toHaveBeenCalled();
    });
  });

  describe("upload", () => {
    it("should upload a file and return its ID", async () => {
      const file = new File([""], "test.png");
      get.mockResolvedValue({
        $id: "user-123",
      } as unknown as Models.User<Models.Preferences>);
      createFile.mockResolvedValue({
        $id: "file-123",
      } as unknown as Models.File);

      const result = await repository.upload(file);

      expect(result).toBe("file-123");
      expect(createFile).toHaveBeenCalledWith({
        bucketId,
        fileId: "unique-id",
        file,
      });
    });
  });

  describe("delete", () => {
    it("should delete a file", async () => {
      get.mockResolvedValue({
        $id: "user-123",
      } as unknown as Models.User<Models.Preferences>);
      deleteFile.mockResolvedValue(undefined);

      await repository.delete("file-123");

      expect(deleteFile).toHaveBeenCalledWith({ bucketId, fileId: "file-123" });
    });
  });

  describe("getPreview", () => {
    it("should return preview URL", () => {
      const mockUrl = "http://preview/file-123";
      getFilePreview.mockReturnValue(mockUrl);

      const result = repository.getPreview("file-123");

      expect(result).toBe(mockUrl);
      expect(getFilePreview).toHaveBeenCalledWith({
        bucketId,
        fileId: "file-123",
      });
    });
  });
});
