import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteImageUseCase } from "./delete-image.use-case";
import type { StorageRepository } from "../repositories/storage.repository";

describe("DeleteImageUseCase", () => {
  let mockStorageRepository: StorageRepository;
  const deleteImage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageRepository = {
      upload: vi.fn(),
      delete: deleteImage,
      getPreview: vi.fn(),
    };
  });

  it("should delete a file by its ID", async () => {
    const useCase = new DeleteImageUseCase(mockStorageRepository);
    deleteImage.mockResolvedValue(undefined);

    await useCase.execute("file-123");

    expect(deleteImage).toHaveBeenCalledWith("file-123");
  });
});
