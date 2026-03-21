import type {
  FileData,
  StorageRepository,
} from "../repositories/storage.repository";
import { ValidationError } from "../errors/domain-errors";

/**
 * Use case for uploading an image to storage.
 */
export class UploadImageUseCase {
  /**
   * Default maximum allowed file size for image uploads (20MB).
   * Aligned with Appwrite's optimization limits.
   */
  public static readonly DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024;

  constructor(
    private readonly storageRepository: StorageRepository,
    private readonly maxFileSize: number = UploadImageUseCase.DEFAULT_MAX_FILE_SIZE,
  ) {}

  /**
   * Executes the use case to upload a file after validation.
   *
   * Business Rules:
   * - Only images are allowed (MIME type must start with "image/").
   * - File size must not exceed the configured maxFileSize.
   *
   * @param file - The file data to upload.
   * @returns A Promise that resolves to the fileId of the uploaded image.
   * @throws {ValidationError} If the file fails validation.
   */
  async execute(file: FileData): Promise<string> {
    if (!file.mimeType.startsWith("image/")) {
      throw new ValidationError("Invalid file type. Only images are allowed.");
    }

    const actualLength = file.size;

    if (actualLength > this.maxFileSize) {
      const maxMb = String(this.maxFileSize / 1024 / 1024);
      throw new ValidationError(
        `File size exceeds the maximum limit of ${maxMb}MB.`,
      );
    }

    return this.storageRepository.upload(file);
  }
}
