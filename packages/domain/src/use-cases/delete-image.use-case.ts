import type { StorageRepository } from "../repositories/storage.repository";

/**
 * Use case for deleting an image from storage.
 */
export class DeleteImageUseCase {
  constructor(private readonly storageRepository: StorageRepository) {}

  /**
   * Executes the use case to delete an image.
   * @param fileId - The unique identifier of the image to delete.
   * @returns A Promise that resolves when the image is deleted.
   */
  async execute(fileId: string): Promise<void> {
    await this.storageRepository.delete(fileId);
  }
}
