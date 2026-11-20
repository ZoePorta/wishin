import { useState, useCallback, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import {
  UploadImageUseCase,
  GetImagePreviewUseCase,
  DeleteImageUseCase,
  type FileData,
  type StorageRepository,
} from "@wishin/domain";
import { useStorageRepository } from "../contexts/WishlistRepositoryContext";
import { UniversalAlert as Alert } from "../utils/Alert";
import {
  assertIsImage,
  isNotAnImageError,
  prepareImageForUpload,
  type PickedImage,
} from "../utils/image-processing";

/** `extent` (used to flatten transparency onto a background) is only implemented on web. */
const PREPARE_OPTIONS = { canFlatten: Platform.OS === "web" };

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
  const { t } = useTranslation();
  const [inflightCount, setInflightCount] = useState(0);
  const uploading = inflightCount > 0;
  const [error, setError] = useState<string | null>(null);
  const latestRequestRef = useRef(0);

  /**
   * Tells the user why an image could not be used: a specific message when the
   * file is not an image, the generic upload failure otherwise.
   *
   * @param {unknown} err - The error thrown while picking, preparing or uploading.
   */
  const showUploadError = useCallback(
    (err: unknown) => {
      if (isNotAnImageError(err)) {
        Alert.alert(
          t("imagePicker.notAnImageTitle"),
          t("imagePicker.notAnImageMessage"),
        );
        return;
      }
      Alert.alert(
        t("imagePicker.uploadFailedTitle"),
        t("imagePicker.uploadFailedMessage"),
      );
    },
    [t],
  );

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
          t("imagePicker.permissionTitle"),
          t("imagePicker.uploadPermission"),
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
      const picked: PickedImage = {
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      };
      assertIsImage(picked);
      const prepared = await prepareImageForUpload(picked, PREPARE_OPTIONS);

      if (requestId !== latestRequestRef.current) return null;

      const fileData = await resolveFileData(prepared);

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
        showUploadError(err);
      }
      return null;
    } finally {
      if (didIncrement) {
        setInflightCount((prev) => Math.max(0, prev - 1));
      }
    }
  }, [storageRepository, t, showUploadError]);

  /**
   * Prepares (resizes/re-encodes) a picked image, uploads it and returns its preview URL.
   * Resolves file size if not provided.
   *
   * @param {PickedImage} file - The picked image (URI plus optional name, MIME type, size and dimensions).
   * @returns {Promise<string | null>} The preview URL of the uploaded image, or null if failed.
   */
  const uploadFile = useCallback(
    async (file: PickedImage): Promise<string | null> => {
      const requestId = ++latestRequestRef.current;

      if (requestId === latestRequestRef.current) {
        setError(null);
      }

      setInflightCount((prev) => prev + 1);
      try {
        assertIsImage(file);
        const prepared = await prepareImageForUpload(file, PREPARE_OPTIONS);
        if (requestId !== latestRequestRef.current) return null;

        const fileData = await resolveFileData(prepared);

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
          showUploadError(err);
        }
        return null;
      } finally {
        setInflightCount((prev) => Math.max(0, prev - 1));
      }
    },
    [storageRepository, t, showUploadError],
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
