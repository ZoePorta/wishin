import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppwriteStorageRepository } from "./appwrite-storage.repository";
import { Client, type Models } from "appwrite";
import { PersistenceError } from "@wishin/domain";
import type { ObservabilityService, Logger } from "@wishin/domain";

// Share mocks using vi.hoisted
const { get, createFile, deleteFile, getFilePreview } = vi.hoisted(() => ({
  get: vi.fn(),
  createFile: vi.fn(),
  deleteFile: vi.fn(),
  getFilePreview: vi.fn(),
}));

// Mock Appwrite SDK
vi.mock("appwrite", () => {
  const AccountMock = vi.fn().mockImplementation(function () {
    return {
      get,
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

  const mockLogger = {
    error: vi.fn(),
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
      bucketId,
      mockLogger,
      mockObservability,
    );
  });

  describe("resolveSession", () => {
    it("should return user if session exists", async () => {
      const mockUser = { $id: "user-123" };
      get.mockResolvedValue(
        mockUser as unknown as Models.User<Models.Preferences>,
      );

      const user = await repository.resolveSession();

      expect(user).toEqual(mockUser);
      expect(get).toHaveBeenCalled();
    });

    it("should return null if 401 error occurs", async () => {
      get.mockRejectedValue({ code: 401 });

      const user = await repository.resolveSession();

      expect(user).toBeNull();
      expect(get).toHaveBeenCalled();
    });

    it("should throw PersistenceError if a non-401 error occurs", async () => {
      const unexpectedError = new Error("Network failure") as Error & {
        code?: number;
      };
      unexpectedError.code = 500;
      get.mockRejectedValue(unexpectedError);

      await expect(repository.resolveSession()).rejects.toThrow(
        PersistenceError,
      );
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

    it("should return null if no session", async () => {
      get.mockRejectedValue({ code: 401 });

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
      get.mockResolvedValue({
        $id: "user-123",
      } as unknown as Models.User<Models.Preferences>);
      createFile.mockResolvedValue({
        $id: "file-123",
      } as unknown as Models.File);

      const result = await repository.upload(fileData);

      expect(result).toBe("file-123");
      expect(createFile).toHaveBeenCalledWith({
        bucketId,
        fileId: "unique-id",
        file: expect.any(File) as unknown as File,
      });
    });

    it("should throw PersistenceError if no session and not call storage", async () => {
      const fileData = {
        buffer: new Uint8Array([1, 2, 3]),
        filename: "test.png",
        mimeType: "image/png",
        size: 3,
      };
      get.mockRejectedValue({ code: 401 });

      await expect(repository.upload(fileData)).rejects.toThrow(
        PersistenceError,
      );
      expect(createFile).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete a file", async () => {
      get.mockResolvedValue({
        $id: "user-123",
      } as unknown as Models.User<Models.Preferences>);
      deleteFile.mockResolvedValue(undefined);

      await repository.delete("file-123");

      expect(deleteFile).toHaveBeenCalledWith({
        bucketId,
        fileId: "file-123",
      });
    });

    it("should throw PersistenceError if no session and not call storage", async () => {
      get.mockRejectedValue({ code: 401 });

      await expect(repository.delete("file-123")).rejects.toThrow(
        PersistenceError,
      );
      expect(deleteFile).not.toHaveBeenCalled();
    });
  });

  describe("getPreview", () => {
    it("should return preview URL string from string return", async () => {
      const mockUrl = "http://preview/file-123";
      getFilePreview.mockReturnValue(mockUrl);

      const result = await repository.getPreview("file-123");

      expect(result).toBe(mockUrl);
      expect(getFilePreview).toHaveBeenCalledWith({
        bucketId,
        fileId: "file-123",
      });
    });

    it("should return preview URL string from URL object return", async () => {
      const mockUrl = "http://preview/file-123";
      const urlObject = {
        toString: () => mockUrl,
        href: mockUrl,
      };
      getFilePreview.mockReturnValue(urlObject);

      const result = await repository.getPreview("file-123");

      expect(result).toBe(mockUrl);
    });
  });
});
