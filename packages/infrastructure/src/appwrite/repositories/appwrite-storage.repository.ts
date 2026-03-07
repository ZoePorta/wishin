import { Client, Storage, Account, type Models, ID } from "appwrite";
import {
  type StorageRepository,
  type FileData,
  PersistenceError,
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

  /**
   * Initializes the repository.
   * @param client - The Appwrite Client SDK instance.
   * @param bucketId - The ID of the Appwrite storage bucket.
   */
  constructor(
    private readonly client: Client,
    private readonly bucketId: string,
  ) {
    this.storage = new Storage(this.client);
    this.account = new Account(this.client);
  }

  private ensureSessionInFlight: Promise<void> | null = null;
  private sessionEnsured = false;
  private _currentUser: Models.User<Models.Preferences> | null = null;

  /**
   * Ensures an active session exists.
   * Creates an anonymous session if no session is active.
   *
   * @returns {Promise<Models.User<Models.Preferences>>} The current user model.
   * @throws {PersistenceError} If the session cannot be ensured.
   */
  async ensureSession(): Promise<Models.User<Models.Preferences>> {
    if (this.sessionEnsured && this._currentUser) {
      return this._currentUser;
    }

    if (this.ensureSessionInFlight) {
      await this.ensureSessionInFlight;
      if (this._currentUser) return this._currentUser;
    }

    this.ensureSessionInFlight = (async () => {
      try {
        this._currentUser = await this.account.get();
        this.sessionEnsured = true;
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === 401
        ) {
          try {
            await this.account.createAnonymousSession();
            this._currentUser = await this.account.get();
            this.sessionEnsured = true;
          } catch (sessionError: unknown) {
            throw new PersistenceError("Failed to create anonymous session", {
              cause:
                sessionError instanceof Error
                  ? sessionError
                  : String(sessionError),
            });
          }
        } else {
          throw new PersistenceError("Failed to get current account", {
            cause: error instanceof Error ? error : String(error),
          });
        }
      }
    })();

    try {
      await this.ensureSessionInFlight;
    } finally {
      this.ensureSessionInFlight = null;
    }

    if (!this._currentUser) {
      throw new PersistenceError("Session initialization failed: user is null");
    }

    return this._currentUser;
  }

  /**
   * Uploads a file to the Appwrite bucket.
   * @param fileData - The file data to upload.
   * @returns A promise that resolves to the fileId.
   * @throws {PersistenceError} If the upload fails.
   */
  async upload(fileData: FileData): Promise<string> {
    await this.ensureSession();
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
      throw new PersistenceError("AppwriteStorageRepository.upload failed", {
        cause: error instanceof Error ? error : String(error),
      });
    }
  }

  /**
   * Deletes a file from the Appwrite bucket.
   * @param fileId - The unique identifier of the file.
   * @throws {PersistenceError} If the deletion fails.
   */
  async delete(fileId: string): Promise<void> {
    await this.ensureSession();
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
   */
  async getCurrentUserId(): Promise<string> {
    const user = await this.ensureSession();
    return user.$id;
  }

  /**
   * Returns a preview URL for the image.
   * @param fileId - The unique identifier of the file.
   * @returns A promise that resolves to the preview URL string.
   */
  async getPreview(fileId: string): Promise<string> {
    const result = this.storage.getFilePreview({
      bucketId: this.bucketId,
      fileId,
    }) as string | { toString(): string };

    // Appwrite SDK returns a URL object in web environments.
    // Ensure we return a string as defined in StorageRepository.
    return typeof result === "string" ? result : result.toString();
  }
}
