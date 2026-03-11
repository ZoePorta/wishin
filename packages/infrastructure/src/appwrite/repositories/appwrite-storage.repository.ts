import { Models, Client, Storage, Account, ID } from "appwrite";
import {
  type StorageRepository,
  type FileData,
  PersistenceError,
  type Logger,
  type ObservabilityService,
} from "@wishin/domain";
import type { SessionAwareRepository } from "./session-aware-repository.interface";

/**
 * Appwrite implementation of the StorageRepository.
 */
export class AppwriteStorageRepository
  implements StorageRepository, SessionAwareRepository
{
  private readonly storage: Storage;
  private readonly account: Account;

  private _currentUser: Models.User<Models.Preferences> | null = null;
  private resolveSessionInFlight: Promise<Models.User<Models.Preferences> | null> | null =
    null;

  /**
   * Initializes the repository.
   * @param client - The Appwrite Client SDK instance.
   * @param bucketId - The Appwrite storage bucket ID.
   * @param logger - The domain logger for infrastructure events.
   * @param observability - Service for breadcrumbs and telemetry events.
   */
  constructor(
    private readonly client: Client,
    private readonly bucketId: string,
    private readonly logger: Logger,
    private readonly observability: ObservabilityService,
  ) {
    this.storage = new Storage(this.client);
    this.account = new Account(this.client);
  }

  /**
   * Resolves the current session state.
   *
   * @returns A Promise that resolves to the user object if a session is active/created, or null otherwise.
   * @throws {PersistenceError} If the session resolution fails (e.g., network error).
   */
  async resolveSession(): Promise<Models.User<Models.Preferences> | null> {
    if (this._currentUser) {
      return this._currentUser;
    }

    if (this.resolveSessionInFlight) {
      return this.resolveSessionInFlight;
    }

    this.resolveSessionInFlight = (async () => {
      try {
        this._currentUser = await this.account.get();
        return this._currentUser;
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === 401
        ) {
          this._currentUser = null;
          return null;
        }
        this.logger.error("Failed to get current account", { error });
        throw new PersistenceError("Failed to get current account", {
          cause: error instanceof Error ? error : String(error),
        });
      } finally {
        this.resolveSessionInFlight = null;
      }
    })();

    return this.resolveSessionInFlight;
  }

  /**
   * Uploads a file to the Appwrite bucket.
   * @param fileData - The file data to upload.
   * @returns A promise that resolves to the fileId.
   * @throws {PersistenceError} If the upload fails.
   */
  async upload(fileData: FileData): Promise<string> {
    const session = await this.resolveSession();
    if (!session) {
      throw new PersistenceError(
        "Unauthorized: No active session for file upload",
      );
    }
    try {
      // Platform-agnostic conversion to File for Appwrite SDK
      // This ensures we preserve the filename and MIME type.
      const file = new File(
        [new Uint8Array(fileData.buffer)],
        fileData.filename,
        {
          type: fileData.mimeType,
        },
      );

      const result = await this.storage.createFile({
        bucketId: this.bucketId,
        fileId: ID.unique(),
        file,
      });

      return result.$id;
    } catch (error: unknown) {
      this.logger.error("AppwriteStorageRepository.upload failed", { error });
      throw new PersistenceError("Failed to upload file", {
        cause: error instanceof Error ? error : String(error),
      });
    }
  }

  /**
   * Deletes a file from the Appwrite bucket.
   * @param fileId - The unique identifier of the file.
   * @returns {Promise<void>} Resolves when the file is deleted or rejects with PersistenceError on failure.
   * @throws {PersistenceError} If the deletion fails.
   */
  async delete(fileId: string): Promise<void> {
    const session = await this.resolveSession();
    if (!session) {
      throw new PersistenceError(
        "Unauthorized: No active session for file deletion",
      );
    }
    try {
      await this.storage.deleteFile({
        bucketId: this.bucketId,
        fileId,
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 404
      ) {
        return; // Already deleted
      }
      throw new PersistenceError("AppwriteStorageRepository.delete failed", {
        cause: error instanceof Error ? error : String(error),
      });
    }
  }

  /**
   * Retrieves the current user's unique identifier.
   * @returns {Promise<string>} The current user's unique identifier.
   * @throws {PersistenceError} If the session cannot be retrieved.
   */
  async getCurrentUserId(): Promise<string | null> {
    const user = await this.resolveSession();
    return user?.$id ?? null;
  }

  /**
   * Returns a preview URL for the image.
   * @param fileId - The unique identifier of the file.
   * @returns A promise that resolves to the preview URL string.
   * @throws {PersistenceError} If the preview cannot be generated.
   */
  async getPreview(fileId: string): Promise<string> {
    const result = this.storage.getFilePreview({
      bucketId: this.bucketId,
      fileId,
    }) as unknown as string | { toString(): string };

    // Appwrite SDK returns a URL object in web environments.
    // Ensure we return a string as defined in StorageRepository.
    return typeof result === "string" ? result : result.toString();
  }
}
