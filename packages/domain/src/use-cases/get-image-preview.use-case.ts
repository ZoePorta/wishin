import type { StorageRepository } from "../repositories/storage.repository";

/**
 * Use case for getting a preview URL for an image.
 */
export class GetImagePreviewUseCase {
  constructor(private readonly storageRepository: StorageRepository) {}

  /**
   * Executes the use case to get an image preview.
   * @param fileId - The unique identifier of the image.
   * @returns A promise that resolves to the preview URL or identifier.
   */
  async execute(fileId: string): Promise<string> {
    return this.storageRepository.getPreview(fileId);
  }
}
