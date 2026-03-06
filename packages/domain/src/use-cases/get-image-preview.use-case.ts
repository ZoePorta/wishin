import type { StorageRepository } from "../repositories/storage.repository";

/**
 * Use case for getting a preview URL for an image.
 */
export class GetImagePreviewUseCase {
  constructor(private readonly storageRepository: StorageRepository) {}

  /**
   * Executes the use case to get an image preview.
   * @param fileId - The unique identifier of the image.
   * @returns The preview URL or identifier.
   */
  execute(fileId: string): string {
    return this.storageRepository.getPreview(fileId);
  }
}
