import { useState, useCallback, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import {
  UploadImageUseCase,
  GetImagePreviewUseCase,
  DeleteImageUseCase,
  type FileData,
  type StorageRepository,
} from "@wishin/domain";
import { useStorageRepository } from "../contexts/WishlistRepositoryContext";

/**
 * Resolves file metadata for an image asset, including file size.
 * Uses fetch to determine size if not provided by the asset.
 *
 * @param {Object} asset - Image asset data from ImagePicker or manual input.
 * @returns {Promise<FileData>} Resolved file data with size, uri, filename and mimeType.
 * @throws {Error} If file size cannot be determined.
 */
async function resolveFileData(asset: {
  uri: string;
  fileName?: string | null;
  mimeType?: string;
  fileSize?: number;
}): Promise<FileData> {
  let fileSize = asset.fileSize;

  if (!fileSize || fileSize === 0) {
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      fileSize = blob.size;
    } catch (fetchErr) {
      console.error("Failed to determine file size via fetch:", fetchErr);
    }
  }

  if (!fileSize || fileSize === 0) {
    throw new Error(
      "Could not determine image size. Please try another image.",
    );
  }

  return {
    uri: asset.uri,
    filename: asset.fileName ?? asset.uri.split("/").pop() ?? "image.jpg",
    mimeType: asset.mimeType ?? "image/jpeg",
    size: fileSize,
  };
}

/**
 * Executes the upload and preview pipeline for a given file.
 *
 * @param {FileData} fileData - The file to upload.
 * @param {StorageRepository} storageRepository - The storage repository instance.
 * @returns {Promise<string>} The preview URL of the uploaded image.
 */
async function uploadAndGetPreview(
  fileData: FileData,
  storageRepository: StorageRepository,
): Promise<string> {
  const uploadUseCase = new UploadImageUseCase(storageRepository);
  const fileId = await uploadUseCase.execute(fileData);

  const previewUseCase = new GetImagePreviewUseCase(storageRepository);
  const previewUrl = await previewUseCase.execute(fileId);

  return previewUrl;
}

/**
 * Custom hook to handle picking an image from the device and uploading it to storage.
 * Manages multiple concurrent uploads and provides cleaning functions.
 *
 * @returns {Object} State and functions for image picking and uploading.
 * @returns {boolean} returns.uploading - Whether any image is currently being uploaded.
 * @returns {string|null} returns.error - Error message if the last operation failed.
 * @returns {number} returns.inflightCount - Number of active uploads.
 * @returns {Function} returns.pickAndUpload - Triggers the image picker and starts an upload.
 * @returns {Function} returns.uploadFile - Uploads a selected file from its URI.
 * @returns {Function} returns.deleteUpload - Deletes an uploaded file by its URL.
 */
export function useImagePickerAndUpload() {
  const storageRepository = useStorageRepository();
  const [inflightCount, setInflightCount] = useState(0);
  const uploading = inflightCount > 0;
  const [error, setError] = useState<string | null>(null);
  const latestRequestRef = useRef(0);

  /**
   * Triggers the native image picker and uploads the selected image.
   * Handles permissions, cancellation, and file size resolution.
   *
   * @returns {Promise<string | null>} The preview URL of the uploaded image, or null if canceled/failed.
   */
  const pickAndUpload = useCallback(async (): Promise<string | null> => {
    const requestId = ++latestRequestRef.current;

    if (requestId === latestRequestRef.current) {
      setError(null);
    }

    let didIncrement = false;
    try {
      // Stage 1: Request Permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          "Permission Required",
          "Permission to access the photo gallery is required to upload images.",
        );
        return null;
      }

      // Stage 2: Pick Image
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (requestId !== latestRequestRef.current) return null;

      if (pickerResult.canceled || pickerResult.assets.length === 0) {
        return null;
      }

      setInflightCount((prev) => prev + 1);
      didIncrement = true;

      const asset = pickerResult.assets[0];
      const fileData = await resolveFileData({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
      });

      if (requestId !== latestRequestRef.current) return null;

      const previewUrl = await uploadAndGetPreview(fileData, storageRepository);
      if (requestId !== latestRequestRef.current) return null;

      return previewUrl;
    } catch (err) {
      console.error("Error in pickAndUpload:", err);
      if (requestId === latestRequestRef.current) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setError(message);
        Alert.alert(
          "Upload Failed",
          "Could not upload the image. Please try again.",
        );
      }
      return null;
    } finally {
      if (didIncrement) {
        setInflightCount((prev) => Math.max(0, prev - 1));
      }
    }
  }, [storageRepository]);

  /**
   * Uploads a file from a local URI and returns its preview URL.
   * Resolves file size if not provided.
   *
   * @param {Object} file - The file data to upload.
   * @param {string} file.uri - Local URI of the file.
   * @param {string} [file.fileName] - Optional display name for the file.
   * @param {string} [file.mimeType] - Optional MIME type (defaults to image/jpeg).
   * @param {number} [file.fileSize] - Optional size in bytes.
   * @returns {Promise<string | null>} The preview URL of the uploaded image, or null if failed.
   * @throws {Error} If file size cannot be determined.
   */
  const uploadFile = useCallback(
    async (file: {
      uri: string;
      fileName?: string;
      mimeType?: string;
      fileSize?: number;
    }): Promise<string | null> => {
      const requestId = ++latestRequestRef.current;

      if (requestId === latestRequestRef.current) {
        setError(null);
      }

      setInflightCount((prev) => prev + 1);
      try {
        const fileData = await resolveFileData({
          uri: file.uri,
          fileName: file.fileName,
          mimeType: file.mimeType,
          fileSize: file.fileSize,
        });

        if (requestId !== latestRequestRef.current) return null;

        const previewUrl = await uploadAndGetPreview(
          fileData,
          storageRepository,
        );
        if (requestId !== latestRequestRef.current) return null;

        return previewUrl;
      } catch (err) {
        console.error("Error in uploadFile:", err);
        if (requestId === latestRequestRef.current) {
          const message =
            err instanceof Error ? err.message : "An error occurred";
          setError(message);
          Alert.alert(
            "Upload Failed",
            "Could not upload the image. Please try again.",
          );
        }
        return null;
      } finally {
        setInflightCount((prev) => Math.max(0, prev - 1));
      }
    },
    [storageRepository],
  );

  /**
   * Deletes an uploaded file from storage using its preview URL.
   * Extracts the file ID from the URL before deletion.
   *
   * @param {string} url - The preview URL of the file to delete.
   * @returns {Promise<void>} Resolves when deletion is attempted.
   */
  const deleteUpload = useCallback(
    async (url: string): Promise<void> => {
      const fileId = storageRepository.extractFileId(url);
      if (!fileId) return;

      try {
        const deleteUseCase = new DeleteImageUseCase(storageRepository);
        await deleteUseCase.execute(fileId);
      } catch (err) {
        console.error("Error in deleteUpload:", err);
        // We don't alert the user for cleanup failures as it's an internal background task
      }
    },
    [storageRepository],
  );

  return {
    pickAndUpload,
    uploadFile,
    deleteUpload,
    uploading,
    error,
    inflightCount,
  };
}
