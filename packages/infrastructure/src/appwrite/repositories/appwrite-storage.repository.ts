import {
  Client,
  Storage,
  Account,
  AppwriteException,
  type Models,
  ID,
} from "appwrite";
import type { StorageRepository } from "@wishin/domain";
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
            console.error("Failed to create anonymous session");
            throw sessionError;
          }
        } else {
          throw error;
        }
      }
    })();

    try {
      await this.ensureSessionInFlight;
    } finally {
      this.ensureSessionInFlight = null;
    }

    if (!this._currentUser) {
      throw new Error("Session initialization failed: user is null");
    }

    return this._currentUser;
  }

  /**
   * Uploads a file to the Appwrite bucket.
   * @param file - The file to upload.
   * @returns A promise that resolves to the fileId.
   */
  async upload(file: File): Promise<string> {
    await this.ensureSession();
    try {
      const result = await this.storage.createFile({
        bucketId: this.bucketId,
        fileId: ID.unique(),
        file,
      });
      return result.$id;
    } catch (error) {
      console.error("AppwriteStorageRepository.upload failed:", error);
      throw error;
    }
  }

  /**
   * Deletes a file from the Appwrite bucket.
   * @param fileId - The unique identifier of the file.
   */
  async delete(fileId: string): Promise<void> {
    await this.ensureSession();
    try {
      await this.storage.deleteFile({
        bucketId: this.bucketId,
        fileId,
      });
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        return; // Already deleted
      }
      console.error("AppwriteStorageRepository.delete failed:", error);
      throw error;
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
   * Appwrite preview URLs are generated via the .getFilePreview() method.
   * @param fileId - The unique identifier of the file.
   * @returns The preview URL.
   */
  getPreview(fileId: string): string {
    // Note: getFilePreview returns a URL object or string depending on version,
    // but in web SDK it returns a URL.
    return this.storage.getFilePreview({
      bucketId: this.bucketId,
      fileId,
    });
  }
}
