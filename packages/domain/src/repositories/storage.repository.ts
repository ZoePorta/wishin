/**
 * DTO for file data, decoupling the domain from platform-specific types like File.
 */
export interface FileData {
  /**
   * The binary content of the file.
   * Optional if uri is provided (e.g. for React Native).
   */
  buffer?: ArrayBuffer | Uint8Array;
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
  /**
   * Optional platform-specific URI (e.g. file:// or content:// in React Native).
   */
  uri?: string;
}

/**
 * Interface for managing file storage (images).
 */
export interface StorageRepository {
  /**
   * Uploads a file to the storage.
   * @param file - The file data to upload.
   * @returns {Promise<string>} A promise that resolves to the unique identifier (fileId) of the uploaded file.
   * @throws {PersistenceError} If the upload fails.
   */
  upload(file: FileData): Promise<string>;

  /**
   * Deletes a file from the storage.
   * @param fileId - The unique identifier of the file to delete.
   * @returns {Promise<void>} A promise that resolves when the file is deleted.
   * @throws {PersistenceError} If the deletion fails.
   */
  delete(fileId: string): Promise<void>;

  /**
   * Returns a URL or relative path for previewing the image.
   * @param fileId - The unique identifier of the file.
   * @returns {Promise<string>} A promise that resolves to the preview string (URL or relative identifier).
   * @throws {PersistenceError} If the preview retrieval fails.
   */
  getPreview(fileId: string): Promise<string>;

  /**
   * Extracts a fileId from its corresponding image URL if it's a known storage URL.
   * @param url - The full image URL.
   * @returns {string | null} The extracted fileId or null if it's not a known storage URL.
   */
  extractFileId(url: string): string | null;
}
