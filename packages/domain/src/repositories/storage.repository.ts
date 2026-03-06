/**
 * Interface for managing file storage (images).
 */
export interface StorageRepository {
  /**
   * Uploads a file to the storage.
   * @param file - The file to upload.
   * @returns A promise that resolves to the unique identifier (fileId) of the uploaded file.
   */
  upload(file: File): Promise<string>;

  /**
   * Deletes a file from the storage.
   * @param fileId - The unique identifier of the file to delete.
   * @returns A promise that resolves when the file is deleted.
   */
  delete(fileId: string): Promise<void>;

  /**
   * Returns a URL or relative path for previewing the image.
   * @param fileId - The unique identifier of the file.
   * @returns The preview string (URL or relative identifier).
   */
  getPreview(fileId: string): string;
}
