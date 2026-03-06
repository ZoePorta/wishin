import type { StorageRepository } from "../repositories/storage.repository";

/**
 * Use case for uploading an image to storage.
 */
export class UploadImageUseCase {
  constructor(private readonly storageRepository: StorageRepository) {}

  /**
   * Executes the use case to upload a file.
   * @param file - The file to upload.
   * @returns A Promise that resolves to the fileId of the uploaded image.
   */
  async execute(file: File): Promise<string> {
    return this.storageRepository.upload(file);
  }
}
