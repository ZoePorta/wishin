import { describe, it, expect, vi } from "vitest";
import { UploadImageUseCase } from "./upload-image.use-case";
import { GetImagePreviewUseCase } from "./get-image-preview.use-case";
import { DeleteImageUseCase } from "./delete-image.use-case";
import type { StorageRepository } from "../repositories/storage.repository";

describe("Image Use Cases", () => {
  const upload = vi.fn();
  const deleteImage = vi.fn();
  const getPreview = vi.fn();

  const mockStorageRepository: StorageRepository = {
    upload,
    delete: deleteImage,
    getPreview,
  };

  describe("UploadImageUseCase", () => {
    it("should upload a file and return its ID", async () => {
      const useCase = new UploadImageUseCase(mockStorageRepository);
      const file = new File([""], "test.png", { type: "image/png" });
      upload.mockResolvedValue("file-123");

      const result = await useCase.execute(file);

      expect(result).toBe("file-123");
      expect(upload).toHaveBeenCalledWith(file);
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
