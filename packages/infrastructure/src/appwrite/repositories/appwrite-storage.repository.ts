import {
  Models,
  Client,
  Storage as AppwriteStorage,
  Account,
  ID,
} from "react-native-appwrite";
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
  private readonly storage: AppwriteStorage;
  private readonly account: Account;

  private _currentUser: Models.User<Models.Preferences> | null = null;
  private resolveSessionInFlight: Promise<Models.User<Models.Preferences> | null> | null =
    null;

  /**
   * Initializes the repository.
   * @param client - The Appwrite Client SDK instance.
   * @param endpoint - The Appwrite API endpoint.
   * @param projectId - The Appwrite Project ID.
   * @param bucketId - The Appwrite storage bucket ID.
   * @param logger - The domain logger for infrastructure events.
   * @param observability - Service for breadcrumbs and telemetry events.
   */
  constructor(
    private readonly client: Client,
    private readonly endpoint: string,
    private readonly projectId: string,
    private readonly bucketId: string,
    private readonly logger: Logger,
    private readonly observability: ObservabilityService,
  ) {
    this.storage = new AppwriteStorage(this.client);
    this.account = new Account(this.client);
  }

  /**
   * Resolves the current session state.
   *
   * @returns A Promise that resolves to the user object if a session is active/created, or null otherwise.
   * @throws {PersistenceError} If the session resolution fails (e.g., network error).
   */
  async resolveSession(): Promise<Models.User<Models.Preferences> | null> {
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
      this.logger.info("Starting file upload", {
        filename: fileData.filename,
        mimeType: fileData.mimeType,
        size: fileData.size,
        hasUri: !!fileData.uri,
        hasBuffer: !!fileData.buffer,
      });

      let file:
        | Parameters<AppwriteStorage["createFile"]>[2]
        | File
        | Blob
        | (Blob & { name: string });

      if (fileData.uri) {
        // Universal approach for Web and Mobile: fetch the URI to get a real Blob.
        const response = await fetch(fileData.uri);
        const blob = await response.blob();

        // Generate a unique filename to avoid duplicates and generic "blob" names.
        const extension = fileData.filename.split(".").pop() ?? "jpg";
        const uniqueFilename = `${ID.unique()}.${extension}`;

        // Use File constructor if available (Web) to ensure the filename is correctly
        // captured in the FormData. In RN, we fallback to Object.assign.
        if (typeof File !== "undefined") {
          file = new File([blob], uniqueFilename, { type: blob.type });
        } else {
          file = {
            uri: fileData.uri,
            name: uniqueFilename,
            type: blob.type,
            size: blob.size,
          };
        }

        this.logger.info("Prepared universal file from URI", {
          originalName: fileData.filename,
          uniqueFilename,
          type: blob.type,
          size: blob.size,
        });
      } else if (fileData.buffer) {
        // Fallback for web/node environments using File API if available
        if (typeof File !== "undefined") {
          file = new File(
            [new Uint8Array(fileData.buffer)],
            fileData.filename,
            {
              type: fileData.mimeType,
            },
          );
        } else {
          // If File is not available, we can try using Blob which is more common in RN/Web
          file = new Blob([new Uint8Array(fileData.buffer)], {
            type: fileData.mimeType,
          });
          // We might lose the filename here if the SDK doesn't pick it up from somewhere else,
          // but createFile usually takes the filename from the File object.
        }
      } else {
        throw new PersistenceError(
          "Invalid file data: no buffer or uri provided",
        );
      }

      this.logger.info("Calling Appwrite createFile", {
        bucketId: this.bucketId,
        fileInfo: typeof file === "object" ? Object.keys(file) : typeof file,
      });

      // Use the object parameter style for createFile as recommended for React Native.
      const result = await this.storage.createFile({
        bucketId: this.bucketId,
        fileId: ID.unique(),
        file: file as Parameters<AppwriteStorage["createFile"]>[2],
      });

      this.logger.info("File upload successful", { fileId: result.$id });
      return result.$id;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error("AppwriteStorageRepository.upload failed", {
        error: errorMsg,
        stack,
      });
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
    // Manually construct the Appwrite file view URL to ensure consistency.
    // In some environments, the SDK's getFileView returns a Promise or even an ArrayBuffer,
    // which causes issues when we need a simple URL string for the database.
    // By constructing it manually, we also guarantee no transformations are applied.
    const previewUrl = `${this.endpoint}/storage/buckets/${this.bucketId}/files/${fileId}/view?project=${this.projectId}`;

    this.logger.info("Constructed image file URL", { fileId, previewUrl });

    return previewUrl;
  }

  /**
   * Extracts a fileId from its corresponding image URL if it's a known storage URL.
   * @param url - The full image URL.
   * @returns {string | null} The extracted fileId or null if it's not a known storage URL.
   */
  extractFileId(url: string): string | null {
    if (!url) return null;

    try {
      const parsedUrl = new URL(url);

      // Check if it's the correct endpoint
      const expectedEndpoint = new URL(this.endpoint);
      if (parsedUrl.host !== expectedEndpoint.host) return null;

      // Normalize pathnames by removing trailing slashes for comparison
      const normalizePath = (p: string) => p.replace(/\/+$/, "");
      const normalizedParsedPath = normalizePath(parsedUrl.pathname);
      const normalizedExpectedPath = normalizePath(expectedEndpoint.pathname);

      // Ensure the endpoint pathname is a prefix of the original URL's pathname
      if (!normalizedParsedPath.startsWith(normalizedExpectedPath)) return null;

      // Check project query param if it exists in the expected endpoint or use this.projectId
      const expectedProject =
        expectedEndpoint.searchParams.get("project") ?? this.projectId;
      if (parsedUrl.searchParams.get("project") !== expectedProject)
        return null;

      // Pattern: /storage/buckets/{bucketId}/files/{fileId}/view
      // We look for the bucketId and the "files" marker relative to the normalized expected path
      const pathSuffix = normalizedParsedPath
        .slice(normalizedExpectedPath.length)
        .split("/")
        .filter(Boolean);

      // pathSuffix should look like: ['storage', 'buckets', bucketId, 'files', fileId, 'view']
      const bucketIdx = pathSuffix.indexOf("buckets");
      const filesIdx = pathSuffix.indexOf("files");
      const viewIdx = pathSuffix.indexOf("view");

      if (
        bucketIdx !== -1 &&
        filesIdx === bucketIdx + 2 &&
        viewIdx === filesIdx + 2 &&
        pathSuffix[bucketIdx + 1] === this.bucketId
      ) {
        return pathSuffix[filesIdx + 1];
      }
    } catch {
      // Not a valid URL
      return null;
    }

    return null;
  }
}
