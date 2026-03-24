import React from "react";
import { View, Image, StyleSheet, Alert } from "react-native";
import {
  Text,
  IconButton,
  useTheme,
  Surface,
  TouchableRipple,
  Portal,
  Modal,
  List,
  Button,
} from "react-native-paper";
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
  /**
   * Accessibility label for the field.
   */
  accessibilityLabel?: string;
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
  accessibilityLabel,
}) => {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = React.useState(false);

  const openMenu = () => {
    setMenuVisible(true);
  };
  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleImageResult = (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      onImageSelected({
        uri: asset.uri,
        name: asset.fileName ?? asset.uri.split("/").pop() ?? "image.jpg",
        type: asset.mimeType ?? "image/jpeg",
        size: asset.fileSize ?? 0,
      });
    }
  };

  /**
   * Launches the image library to pick an image.
   * Requests permissions if necessary.
   */
  const pickImage = async () => {
    closeMenu();
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          "Permission Required",
          "Permission to access the photo gallery is required to add images to your items.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      handleImageResult(result);
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick an image. Please try again.");
    }
  };

  /**
   * Launches the camera to take a photo.
   * Requests permissions if necessary.
   */
  const takePhoto = async () => {
    closeMenu();
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          "Permission Required",
          "Permission to access the camera is required to take photos of your items.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      handleImageResult(result);
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take a photo. Please try again.");
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
          <Surface
            style={styles.previewContainer}
            elevation={1}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="image"
          >
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
          <View>
            <TouchableRipple
              onPress={openMenu}
              disabled={disabled}
              rippleColor={theme.colors.onSurfaceVariant}
              accessibilityLabel={accessibilityLabel ?? "Add photo"}
              accessibilityRole="button"
              style={[
                styles.placeholder,
                {
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.surfaceVariant,
                },
              ]}
            >
              <View style={styles.rippleInner}>
                <List.Icon
                  icon="camera-plus"
                  color={theme.colors.onSurfaceVariant}
                />
                <Text variant="bodyMedium">Add Photo</Text>
              </View>
            </TouchableRipple>

            <Portal>
              <Modal
                visible={menuVisible}
                onDismiss={closeMenu}
                contentContainerStyle={styles.modalContent}
              >
                <Surface style={styles.modalSurface} elevation={5}>
                  <Text variant="titleMedium" style={styles.modalTitle}>
                    Select Photo Source
                  </Text>
                  <List.Item
                    title="Take Photo"
                    left={(props) => <List.Icon {...props} icon="camera" />}
                    onPress={() => {
                      void takePhoto();
                    }}
                  />
                  <List.Item
                    title="Choose from Gallery"
                    left={(props) => <List.Icon {...props} icon="image" />}
                    onPress={() => {
                      void pickImage();
                    }}
                  />
                  <Button
                    onPress={closeMenu}
                    style={styles.cancelButton}
                    mode="text"
                  >
                    Cancel
                  </Button>
                </Surface>
              </Modal>
            </Portal>
          </View>
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
    overflow: "hidden",
  },
  rippleInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: 20,
    justifyContent: "center",
  },
  modalSurface: {
    padding: 8,
    borderRadius: 16,
  },
  modalTitle: {
    padding: 16,
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 8,
  },
});
