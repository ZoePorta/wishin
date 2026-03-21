import { AppwriteStorageRepository } from "./appwrite-storage.repository";
import { Client, type Models } from "react-native-appwrite";
import { PersistenceError } from "@wishin/domain";
import type { ObservabilityService, Logger } from "@wishin/domain";

// Share mocks using vi.hoisted
const { get, createFile, deleteFile, getFileView } = vi.hoisted(() => ({
  get: vi.fn(),
  createFile: vi.fn(),
  deleteFile: vi.fn(),
  getFileView: vi.fn(),
}));

// Mock Appwrite SDK
vi.mock("react-native-appwrite", () => {
  const AccountMock = vi.fn().mockImplementation(function () {
    return {
      get,
    };
  });

  const StorageMock = vi.fn().mockImplementation(function () {
    return {
      createFile,
      deleteFile,
      getFileView,
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

  const mockLogger = {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  } as unknown as Logger;

  const mockObservability = {
    addBreadcrumb: vi.fn(),
    trackEvent: vi.fn(),
  } as unknown as ObservabilityService;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new Client();
    repository = new AppwriteStorageRepository(
      client,
      "https://cloud.appwrite.io/v1",
      "project-123",
      bucketId,
      mockLogger,
      mockObservability,
    );
  });

  describe("resolveSession", () => {
    it("should return user if session exists", async () => {
      const mockUser = { $id: "user-123" };
      vi.mocked(get).mockResolvedValue(
        mockUser as unknown as Models.User<Models.Preferences>,
      );

      const user = await repository.resolveSession();

      expect(user).toEqual(mockUser);
      expect(get).toHaveBeenCalled();
    });

    it("should return null if 401 error occurs", async () => {
      vi.mocked(get).mockRejectedValue({ code: 401 });

      const user = await repository.resolveSession();

      expect(user).toBeNull();
      expect(get).toHaveBeenCalled();
    });

    it("should throw PersistenceError if a non-401 error occurs", async () => {
      const unexpectedError = new Error("Network failure") as Error & {
        code?: number;
      };
      unexpectedError.code = 500;
      vi.mocked(get).mockRejectedValue(unexpectedError);

      await expect(repository.resolveSession()).rejects.toThrow(
        PersistenceError,
      );
    });
  });

  describe("getCurrentUserId", () => {
    it("should return current user ID", async () => {
      const mockUser = { $id: "user-123" };
      vi.mocked(get).mockResolvedValue(
        mockUser as unknown as Models.User<Models.Preferences>,
      );

      const userId = await repository.getCurrentUserId();

      expect(userId).toBe("user-123");
      expect(get).toHaveBeenCalled();
    });

    it("should return null if no session", async () => {
      vi.mocked(get).mockRejectedValue({ code: 401 });

      const userId = await repository.getCurrentUserId();

      expect(userId).toBeNull();
    });
  });

  describe("upload", () => {
    it("should upload a file and return its ID", async () => {
      const fileData = {
        buffer: new Uint8Array([1, 2, 3]),
        filename: "test.png",
        mimeType: "image/png",
        size: 3,
      };
      vi.mocked(get).mockResolvedValue({
        $id: "user-123",
      } as unknown as Models.User<Models.Preferences>);
      vi.mocked(createFile).mockResolvedValue({
        $id: "file-123",
      } as unknown as Models.File);

      const result = await repository.upload(fileData);

      expect(result).toBe("file-123");
      expect(createFile).toHaveBeenCalledWith({
        bucketId,
        fileId: "unique-id",
        file: expect.anything() as unknown,
      });
    });

    it("should upload a file via URI and return its ID", async () => {
      const fileData = {
        uri: "file:///test.png",
        filename: "test.png",
        mimeType: "image/png",
        size: 3,
      };

      // Mock global fetch for universal approach
      const mockBlob = { size: 3, type: "image/png" };
      const mockResponse = {
        blob: vi.fn().mockResolvedValue(mockBlob),
      };
      const globalFetch = vi.fn().mockResolvedValue(mockResponse);
      vi.stubGlobal("fetch", globalFetch);

      vi.mocked(get).mockResolvedValue({
        $id: "user-123",
      } as unknown as Models.User<Models.Preferences>);
      vi.mocked(createFile).mockResolvedValue({
        $id: "file-uri-123",
      } as unknown as Models.File);

      const result = await repository.upload(fileData);

      expect(result).toBe("file-uri-123");
      expect(globalFetch).toHaveBeenCalledWith("file:///test.png");
      expect(createFile).toHaveBeenCalledWith({
        bucketId,
        fileId: "unique-id",
        file: expect.objectContaining({
          name: "unique-id.png",
        }) as unknown as File,
      });

      vi.unstubAllGlobals();
    });

    it("should throw PersistenceError if no session and not call storage", async () => {
      const fileData = {
        buffer: new Uint8Array([1, 2, 3]),
        filename: "test.png",
        mimeType: "image/png",
        size: 3,
      };
      vi.mocked(get).mockRejectedValue({ code: 401 });

      await expect(repository.upload(fileData)).rejects.toThrow(
        PersistenceError,
      );
      expect(createFile).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete a file", async () => {
      vi.mocked(get).mockResolvedValue({
        $id: "user-123",
      } as unknown as Models.User<Models.Preferences>);
      vi.mocked(deleteFile).mockResolvedValue(undefined);

      await repository.delete("file-123");

      expect(deleteFile).toHaveBeenCalledWith({
        bucketId,
        fileId: "file-123",
      });
    });

    it("should throw PersistenceError if no session and not call storage", async () => {
      vi.mocked(get).mockRejectedValue({ code: 401 });

      await expect(repository.delete("file-123")).rejects.toThrow(
        PersistenceError,
      );
      expect(deleteFile).not.toHaveBeenCalled();
    });
  });

  describe("getPreview", () => {
    it("should return a manually constructed URL", async () => {
      const fileId = "file-123";
      const result = await repository.getPreview(fileId);

      const expectedUrl = `https://cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${fileId}/view?project=project-123`;
      expect(result).toBe(expectedUrl);
    });
  });

  describe("extractFileId", () => {
    it("should extract fileId from a valid Appwrite URL", () => {
      const fileId = "file-123";
      const url = `https://cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${fileId}/view?project=project-123`;
      const result = repository.extractFileId(url);

      expect(result).toBe(fileId);
    });

    it("should return null for non-storage URLs", () => {
      const url = "https://example.com/image.png";
      const result = repository.extractFileId(url);

      expect(result).toBeNull();
    });

    it("should return null for Appwrite URLs from a different bucket", () => {
      const url = `https://cloud.appwrite.io/v1/storage/buckets/other-bucket/files/file-123/view?project=project-123`;
      const result = repository.extractFileId(url);

      expect(result).toBeNull();
    });

    it("should return null for Appwrite URLs from a different endpoint", () => {
      const url = `https://other.appwrite.io/v1/storage/buckets/${bucketId}/files/file-123/view?project=project-123`;
      const result = repository.extractFileId(url);

      expect(result).toBeNull();
    });

    it("should return null for malformed Appwrite URLs", () => {
      const url = `https://cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/file-123/edit?project=project-123`;
      const result = repository.extractFileId(url);

      expect(result).toBeNull();
    });
  });
});
