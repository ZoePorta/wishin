import React, { useState, useCallback, useEffect } from "react";
import { View, ScrollView, StyleSheet, FlatList, Alert } from "react-native";
import {
  TextInput,
  Button,
  Text,
  Checkbox,
  SegmentedButtons,
  Portal,
  Modal,
  List,
  Surface,
} from "react-native-paper";
import {
  Priority,
  type WishlistItemOutput,
  type FileData,
} from "@wishin/domain";
import type { AddWishlistItemInput } from "@wishin/domain";
import { PRIORITY_LABELS, SORTED_PRIORITIES } from "../utils/priority";
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "../utils/currencies";
import { commonStyles } from "../../../theme/common-styles";
import {
  ImagePickerField,
  type SelectedImage,
} from "../../../components/common/ImagePickerField";
import { useStorageRepository } from "../../../contexts/WishlistRepositoryContext";

/**
 * Input format for the onSubmit callback.
 * Combines AddWishlistItemInput with an optional id for edit scenarios.
 */
export type AddItemFormSubmission = AddWishlistItemInput & { id?: string };

interface AddItemFormProps {
  wishlistId: string;
  initialData?: WishlistItemOutput;
  onSubmit: (data: AddItemFormSubmission) => Promise<void>;
  loading?: boolean;
}

/**
 * Form component to add or edit items in a wishlist.
 * Uses Material Design 3 components.
 *
 * @param {AddItemFormProps} props - The component props.
 * @param {string} props.wishlistId - The ID of the wishlist the item belongs to.
 * @param {WishlistItemOutput} [props.initialData] - Optional initial data for editing an existing item.
 * @param {function} props.onSubmit - Callback function invoked on form submission.
 * @param {boolean} [props.loading=false] - Optional loading state for the submit button.
 * @returns {JSX.Element} The rendered add/edit item form.
 */
export const AddItemForm: React.FC<AddItemFormProps> = ({
  wishlistId,
  initialData,
  onSubmit,
  loading = false,
}) => {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "0");
  const [currency, setCurrency] = useState(
    initialData?.currency ?? DEFAULT_CURRENCY,
  );
  const [priority, setPriority] = useState<string>(
    String(initialData?.priority ?? Priority.MEDIUM),
  );
  const [totalQuantity, setTotalQuantity] = useState(
    initialData?.totalQuantity.toString() ?? "1",
  );
  const [isUnlimited, setIsUnlimited] = useState(
    initialData?.isUnlimited ?? false,
  );
  const [priceUnknown, setPriceUnknown] = useState(initialData?.price == null);
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null,
  );
  const [useInitialImage, setUseInitialImage] = useState(
    !!initialData?.imageUrl,
  );
  const [isUploading, setIsUploading] = useState(false);

  const storageRepository = useStorageRepository();

  useEffect(() => {
    setName(initialData?.name ?? "");
    setDescription(initialData?.description ?? "");
    setUrl(initialData?.url ?? "");
    setPrice(initialData?.price?.toString() ?? "0");
    setCurrency(initialData?.currency ?? DEFAULT_CURRENCY);
    setPriority(String(initialData?.priority ?? Priority.MEDIUM));
    setTotalQuantity(initialData?.totalQuantity.toString() ?? "1");
    setIsUnlimited(initialData?.isUnlimited ?? false);
    setPriceUnknown(initialData?.price == null);
    setSelectedImage(null);
    setUseInitialImage(!!initialData?.imageUrl);
  }, [initialData]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || loading || isUploading) return;

    setIsUploading(true);
    let uploadedFileId: string | null = null;

    try {
      let finalImageUrl = initialData?.imageUrl;

      // Stage 1: Handle image upload if a new local image is selected
      if (selectedImage) {
        console.warn(
          "Preparing image upload for SelectedImage:",
          selectedImage.name,
        );
        const fileData: FileData = {
          uri: selectedImage.uri,
          filename: selectedImage.name,
          mimeType: selectedImage.type,
          size: selectedImage.size,
        };

        try {
          const fileId = await storageRepository.upload(fileData);
          uploadedFileId = fileId; // Track for cleanup if save fails
          console.warn("Image uploaded successfully, fileId:", fileId);
          finalImageUrl = await storageRepository.getPreview(fileId);
          console.warn("Image preview URL obtained:", finalImageUrl);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          Alert.alert(
            "Upload Failed",
            "There was an error uploading the image. Would you like to save the item without the image?",
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                  setIsUploading(false);
                },
              },
              {
                text: "Save anyway",
                onPress: () => {
                  void (async () => {
                    const payload: AddItemFormSubmission = {
                      wishlistId,
                      name: name.trim(),
                      description: description.trim() || undefined,
                      url: url.trim() || undefined,
                      price: priceUnknown ? undefined : parseFloat(price) || 0,
                      currency: priceUnknown ? undefined : currency,
                      priority: parseInt(priority, 10) as Priority,
                      totalQuantity: isUnlimited
                        ? 1
                        : Math.max(1, parseInt(totalQuantity, 10) || 1),
                      isUnlimited,
                      imageUrl: initialData?.imageUrl, // Keep old image or none
                      id: initialData?.id,
                    };
                    try {
                      await onSubmit(payload);
                    } catch (submitError) {
                      console.error("Error saving anyway:", submitError);
                      Alert.alert(
                        "Save Failed",
                        "Could not save the item. Please try again.",
                      );
                    } finally {
                      setIsUploading(false);
                    }
                  })();
                },
              },
            ],
          );
          return; // Stop execution of the main flow
        }
      } else if (!useInitialImage && initialData?.imageUrl) {
        // Image was explicitly removed
        finalImageUrl = null;
      }

      // Stage 2: Form submission
      const payload: AddItemFormSubmission = {
        wishlistId,
        name: name.trim(),
        description: description.trim() || undefined,
        url: url.trim() || undefined,
        price: priceUnknown ? undefined : parseFloat(price) || 0,
        currency: priceUnknown ? undefined : currency,
        priority: parseInt(priority, 10) as Priority,
        totalQuantity: isUnlimited
          ? 1
          : Math.max(1, parseInt(totalQuantity, 10) || 1),
        isUnlimited,
        imageUrl: finalImageUrl,
        id: initialData?.id,
      };

      try {
        await onSubmit(payload);
      } catch (submitError) {
        console.error("Error submitting form:", submitError);

        // Cleanup: If we uploaded a new image, delete it since the save failed
        if (uploadedFileId) {
          console.warn("Cleaning up orphaned upload:", uploadedFileId);
          try {
            await storageRepository.delete(uploadedFileId);
          } catch (deleteError) {
            console.error("Failed to cleanup orphaned upload:", deleteError);
          }
        }

        Alert.alert(
          "Save Failed",
          "There was an error saving the item. Please try again.",
        );
      }
    } catch (unexpectedError) {
      console.error("Unexpected error in handleSubmit:", unexpectedError);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [
    name,
    loading,
    isUploading,
    wishlistId,
    description,
    url,
    priceUnknown,
    price,
    currency,
    priority,
    isUnlimited,
    totalQuantity,
    selectedImage,
    useInitialImage,
    storageRepository,
    initialData?.imageUrl,
    initialData?.id,
    onSubmit,
  ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ImagePickerField
        accessibilityLabel="Item image"
        imageUri={
          selectedImage?.uri ??
          (useInitialImage ? (initialData?.imageUrl ?? null) : null)
        }
        onImageSelected={(image) => {
          setSelectedImage(image);
          if (image) {
            setUseInitialImage(false); // New image selected
          } else {
            setUseInitialImage(false); // Image removed
          }
        }}
        disabled={loading || isUploading}
      />

      <TextInput
        label="Name*"
        value={name}
        onChangeText={setName}
        mode="outlined"
        placeholder="Product name..."
        disabled={loading}
        style={styles.input}
      />

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={3}
        placeholder="Product description..."
        disabled={loading}
        style={styles.input}
      />

      <View style={styles.row}>
        <View style={styles.flex1}>
          <TextInput
            label="Price"
            value={price}
            onChangeText={setPrice}
            mode="outlined"
            keyboardType="decimal-pad"
            disabled={priceUnknown || loading}
            right={
              <TextInput.Icon
                icon="chevron-down"
                onPress={() => {
                  if (!priceUnknown && !loading)
                    setIsCurrencyModalVisible(true);
                }}
              />
            }
            left={<TextInput.Affix text={currency} />}
          />
          <Checkbox.Item
            label="I don't know the price"
            status={priceUnknown ? "checked" : "unchecked"}
            onPress={() => {
              setPriceUnknown(!priceUnknown);
            }}
            disabled={loading}
            position="leading"
            labelStyle={styles.checkboxLabel}
          />
        </View>

        <View style={styles.quantityContainer}>
          <TextInput
            label="Quantity"
            value={totalQuantity}
            onChangeText={setTotalQuantity}
            mode="outlined"
            keyboardType="number-pad"
            disabled={isUnlimited || loading}
          />
          <Checkbox.Item
            label="Unlimited"
            status={isUnlimited ? "checked" : "unchecked"}
            onPress={() => {
              setIsUnlimited(!isUnlimited);
            }}
            disabled={loading}
            position="leading"
            labelStyle={styles.checkboxLabel}
          />
        </View>
      </View>

      <TextInput
        label="Link (URL)"
        value={url}
        onChangeText={setUrl}
        mode="outlined"
        placeholder="https://..."
        keyboardType="url"
        autoCapitalize="none"
        disabled={loading}
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.label}>
        Priority
      </Text>
      <SegmentedButtons
        value={priority}
        onValueChange={setPriority}
        buttons={SORTED_PRIORITIES.map((p) => ({
          value: String(p),
          label: PRIORITY_LABELS[p],
          disabled: loading || isUploading,
        }))}
        style={styles.segmentedButtons}
      />

      <Button
        mode="contained"
        onPress={() => {
          void handleSubmit();
        }}
        loading={loading || isUploading}
        disabled={!name.trim() || loading || isUploading}
        style={styles.submitButton}
        contentStyle={commonStyles.minimumTouchTarget}
      >
        {initialData ? "Save Changes" : "Add to List"}
      </Button>

      <Portal>
        <Modal
          visible={isCurrencyModalVisible}
          onDismiss={() => {
            setIsCurrencyModalVisible(false);
          }}
          contentContainerStyle={styles.modalContent}
        >
          <Surface style={styles.surface} elevation={5}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              Select Currency
            </Text>
            <FlatList
              style={styles.currencyList}
              data={SUPPORTED_CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <List.Item
                  title={`${item.name} (${item.code})`}
                  onPress={() => {
                    setCurrency(item.code);
                    setIsCurrencyModalVisible(false);
                  }}
                  right={(props) =>
                    currency === item.code ? (
                      <List.Icon {...props} icon="check" />
                    ) : null
                  }
                />
              )}
            />
          </Surface>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  flex1: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    textAlign: "left",
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 8,
  },
  modalContent: {
    padding: 20,
  },
  surface: {
    padding: 8,
  },
  modalTitle: {
    padding: 16,
  },
  quantityContainer: {
    flex: 1,
    marginLeft: 16,
  },
  currencyList: {
    maxHeight: 300,
  },
});
