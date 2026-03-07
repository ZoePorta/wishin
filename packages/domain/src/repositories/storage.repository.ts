/**
 * DTO for file data, decoupling the domain from platform-specific types like File.
 */
export interface FileData {
  /**
   * The binary content of the file.
   */
  buffer: ArrayBuffer | Uint8Array;
  /**
   * The original filename.
   */
  filename: string;
  /**
   * The MIME type of the file (e.g., 'image/png').
   */
  mimeType: string;
  /**
   * The size of the file in bytes.
   */
  size: number;
}

/**
 * Interface for managing file storage (images).
 */
export interface StorageRepository {
  /**
   * Uploads a file to the storage.
   * @param file - The file data to upload.
   * @returns A promise that resolves to the unique identifier (fileId) of the uploaded file.
   */
  upload(file: FileData): Promise<string>;

  /**
   * Deletes a file from the storage.
   * @param fileId - The unique identifier of the file to delete.
   * @returns A promise that resolves when the file is deleted.
   */
  delete(fileId: string): Promise<void>;

  /**
   * Returns a URL or relative path for previewing the image.
   * @param fileId - The unique identifier of the file.
   * @returns A promise that resolves to the preview string (URL or relative identifier).
   */
  getPreview(fileId: string): Promise<string>;
}
