import { describe, it, expect, vi, beforeEach } from "vitest";
import { UploadImageUseCase } from "./upload-image.use-case";
import type {
  StorageRepository,
  FileData,
} from "../repositories/storage.repository";
import { ValidationError } from "../errors/domain-errors";

describe("UploadImageUseCase", () => {
  let mockStorageRepository: StorageRepository;
  const upload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageRepository = {
      upload,
      delete: vi.fn(),
      getPreview: vi.fn(),
    };
  });

  const validFileData: FileData = {
    buffer: new Uint8Array([1, 2, 3]),
    filename: "test.png",
    mimeType: "image/png",
    size: 3,
  };

  it("should upload a valid image and return its ID", async () => {
    const useCase = new UploadImageUseCase(mockStorageRepository);
    upload.mockResolvedValue("file-123");

    const result = await useCase.execute(validFileData);

    expect(result).toBe("file-123");
    expect(upload).toHaveBeenCalledWith(validFileData);
  });

  it("should throw ValidationError if file is not an image", async () => {
    const useCase = new UploadImageUseCase(mockStorageRepository);
    const invalidFile: FileData = {
      ...validFileData,
      mimeType: "text/plain",
    };

    await expect(useCase.execute(invalidFile)).rejects.toThrow(ValidationError);
    expect(upload).not.toHaveBeenCalled();
  });

  it("should throw ValidationError if file size exceeds default limit", async () => {
    const useCase = new UploadImageUseCase(mockStorageRepository);
    const oversizedFile: FileData = {
      ...validFileData,
      size: UploadImageUseCase.DEFAULT_MAX_FILE_SIZE + 1,
      buffer: new Uint8Array(UploadImageUseCase.DEFAULT_MAX_FILE_SIZE + 1),
    };

    await expect(useCase.execute(oversizedFile)).rejects.toThrow(
      ValidationError,
    );
    expect(upload).not.toHaveBeenCalled();
  });

  it("should throw ValidationError if file size exceeds custom limit", async () => {
    const customLimit = 100;
    const useCase = new UploadImageUseCase(mockStorageRepository, customLimit);
    const oversizedFile: FileData = {
      ...validFileData,
      size: customLimit + 1,
      buffer: new Uint8Array(customLimit + 1),
    };

    await expect(useCase.execute(oversizedFile)).rejects.toThrow(
      ValidationError,
    );
  });

  it("should upload successfully if file size is exactly at the limit", async () => {
    const customLimit = 1024;
    const useCase = new UploadImageUseCase(mockStorageRepository, customLimit);
    const boundaryFile: FileData = {
      ...validFileData,
      size: customLimit,
      buffer: new Uint8Array(customLimit),
    };
    upload.mockResolvedValue("file-boundary");

    const result = await useCase.execute(boundaryFile);

    expect(result).toBe("file-boundary");
    expect(upload).toHaveBeenCalledWith(boundaryFile);
  });
});
