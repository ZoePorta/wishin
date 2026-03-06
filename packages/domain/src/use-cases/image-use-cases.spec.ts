import { describe, it, expect, vi, beforeEach } from "vitest";
import { UploadImageUseCase } from "./upload-image.use-case";
import { GetImagePreviewUseCase } from "./get-image-preview.use-case";
import { DeleteImageUseCase } from "./delete-image.use-case";
import type {
  StorageRepository,
  FileData,
} from "../repositories/storage.repository";
import { ValidationError } from "../errors/domain-errors";

describe("Image Use Cases", () => {
  let mockStorageRepository: StorageRepository;
  const upload = vi.fn();
  const deleteImage = vi.fn();
  const getPreview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageRepository = {
      upload,
      delete: deleteImage,
      getPreview,
    };
  });

  const validFileData: FileData = {
    buffer: new Uint8Array([1, 2, 3]),
    filename: "test.png",
    mimeType: "image/png",
    size: 3,
  };

  describe("UploadImageUseCase", () => {
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

      await expect(useCase.execute(invalidFile)).rejects.toThrow(
        ValidationError,
      );

      expect(upload).not.toHaveBeenCalled();
    });

    it("should throw ValidationError if file size exceeds limit", async () => {
      const useCase = new UploadImageUseCase(mockStorageRepository);
      const oversizedFile: FileData = {
        ...validFileData,
        size: UploadImageUseCase.MAX_FILE_SIZE + 1,
      };

      await expect(useCase.execute(oversizedFile)).rejects.toThrow(
        ValidationError,
      );

      expect(upload).not.toHaveBeenCalled();
    });
  });

  describe("GetImagePreviewUseCase", () => {
    it("should return a preview URL for a file ID", () => {
      const useCase = new GetImagePreviewUseCase(mockStorageRepository);
      getPreview.mockReturnValue("http://preview/file-123");

      const result = useCase.execute("file-123");

      expect(result).toBe("http://preview/file-123");

      expect(getPreview).toHaveBeenCalledWith("file-123");
    });
  });

  describe("DeleteImageUseCase", () => {
    it("should delete a file by its ID", async () => {
      const useCase = new DeleteImageUseCase(mockStorageRepository);
      deleteImage.mockResolvedValue(undefined);

      await useCase.execute("file-123");

      expect(deleteImage).toHaveBeenCalledWith("file-123");
    });
  });
});
