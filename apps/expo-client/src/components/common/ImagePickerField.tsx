import React from "react";
import { View, Image, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text, IconButton, useTheme, Surface } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";

export interface SelectedImage {
  uri: string;
  name: string;
  type: string;
  size: number;
}

interface ImagePickerFieldProps {
  /**
   * Optional label for the field.
   */
  label?: string;
  /**
   * The current image URI (local or remote).
   */
  imageUri: string | null;
  /**
   * Callback invoked when an image is selected or removed.
   */
  onImageSelected: (image: SelectedImage | null) => void;
  /**
   * Whether the field is disabled.
   */
  disabled?: boolean;
}

/**
 * A component that allows the user to pick an image from their gallery.
 * Uses Material Design 3 components from react-native-paper.
 *
 * @param {ImagePickerFieldProps} props - The component props.
 * @returns {JSX.Element} The rendered image picker field.
 */
export const ImagePickerField: React.FC<ImagePickerFieldProps> = ({
  label,
  imageUri,
  onImageSelected,
  disabled = false,
}) => {
  const theme = useTheme();

  /**
   * Launches the image library to pick an image.
   * Requests permissions if necessary.
   */
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert(
        "Permission Required",
        "Permission to access the photo gallery is required to add images to your items.",
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        onImageSelected({
          uri: asset.uri,
          name: asset.fileName ?? asset.uri.split("/").pop() ?? "image.jpg",
          type: asset.mimeType ?? "image/jpeg",
          size: asset.fileSize ?? 0,
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick an image. Please try again.");
    }
  };

  /**
   * Removes the currently selected image.
   */
  const removeImage = () => {
    onImageSelected(null);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="labelLarge" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={styles.content}>
        {imageUri ? (
          <Surface style={styles.previewContainer} elevation={1}>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            <IconButton
              icon="close"
              mode="contained"
              containerColor={theme.colors.error}
              iconColor={theme.colors.onError}
              size={20}
              onPress={removeImage}
              style={styles.removeButton}
              disabled={disabled}
            />
          </Surface>
        ) : (
          <TouchableOpacity
            onPress={() => {
              void pickImage();
            }}
            disabled={disabled}
            activeOpacity={0.7}
            style={[
              styles.placeholder,
              {
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surfaceVariant,
              },
            ]}
          >
            <IconButton icon="camera-plus" size={32} disabled={disabled} />
            <Text variant="bodyMedium">Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  content: {
    alignItems: "center",
  },
  previewContainer: {
    width: 150,
    height: 150,
    borderRadius: 12,
    position: "relative",
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    margin: 0,
  },
  placeholder: {
    width: 150,
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
});
