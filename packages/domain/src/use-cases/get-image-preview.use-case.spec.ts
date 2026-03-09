import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetImagePreviewUseCase } from "./get-image-preview.use-case";
import type { StorageRepository } from "../repositories/storage.repository";

describe("GetImagePreviewUseCase", () => {
  let mockStorageRepository: StorageRepository;
  const getPreview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageRepository = {
      upload: vi.fn(),
      delete: vi.fn(),
      getPreview,
    };
  });

  it("should return a preview URL for a file ID", async () => {
    const useCase = new GetImagePreviewUseCase(mockStorageRepository);
    getPreview.mockResolvedValue("http://preview/file-123");

    const result = await useCase.execute("file-123");

    expect(result).toBe("http://preview/file-123");
    expect(getPreview).toHaveBeenCalledWith("file-123");
  });
});
