import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import {
  UploadImageUseCase,
  GetImagePreviewUseCase,
  type FileData,
} from "@wishin/domain";
import { useStorageRepository } from "../contexts/WishlistRepositoryContext";

/**
 * Custom hook to handle picking an image from the device and uploading it to storage.
 *
 * @returns {Object} An object containing the pickAndUpload function and its state.
 */
export function useImagePickerAndUpload() {
  const storageRepository = useStorageRepository();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Triggers the image picker and uploads the selected image.
   *
   * @param {Object} options - Optional picker options.
   * @returns {Promise<string | null>} The preview URL of the uploaded image, or null if canceled/failed.
   */
  const pickAndUpload = useCallback(async (): Promise<string | null> => {
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

      if (pickerResult.canceled || pickerResult.assets.length === 0) {
        return null;
      }

      setUploading(true);
      setError(null);

      const asset = pickerResult.assets[0];
      const fileData: FileData = {
        uri: asset.uri,
        filename: asset.fileName ?? asset.uri.split("/").pop() ?? "image.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
        size: asset.fileSize ?? 0,
      };

      // Stage 3: Upload Image
      const uploadUseCase = new UploadImageUseCase(storageRepository);
      const fileId = await uploadUseCase.execute(fileData);

      // Stage 4: Get Preview URL
      const previewUseCase = new GetImagePreviewUseCase(storageRepository);
      const previewUrl = await previewUseCase.execute(fileId);

      return previewUrl;
    } catch (err) {
      console.error("Error in pickAndUpload:", err);
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      Alert.alert(
        "Upload Failed",
        "Could not upload the image. Please try again.",
      );
      return null;
    } finally {
      setUploading(false);
    }
  }, [storageRepository]);

  return {
    pickAndUpload,
    uploading,
    error,
  };
}
