import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";
import { Visibility, Participation } from "@wishin/domain";
import type { CreateWishlistInput } from "@wishin/domain";
import { useTranslation } from "react-i18next";
import {
  ERROR_MESSAGE_KEYS,
  classifyError,
  isNameError,
  type ErrorKind,
} from "../utils/error-mapper";
import { commonStyles } from "../../../theme/common-styles";

const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 100;

interface WishlistFormProps {
  onSubmit: (data: CreateWishlistInput & { id?: string }) => Promise<void>;
  loading?: boolean;
  initialData?: Partial<CreateWishlistInput> & { id?: string };
  currentUserId: string;
}

/**
 * Component for creating and editing wishlist details.
 * Uses Material Design 3 components.
 *
 * @param {WishlistFormProps} props - The component props.
 * @param {function} props.onSubmit - Callback function invoked on form submission.
 * @param {boolean} [props.loading=false] - Optional loading state for the submit button.
 * @param {Partial<CreateWishlistInput> & { id?: string }} [props.initialData] - Optional initial data for editing.
 * @param {string} props.currentUserId - The ID of the current authenticated user.
 * @returns {JSX.Element} The rendered wishlist form.
 */
export const WishlistForm: React.FC<WishlistFormProps> = ({
  onSubmit,
  loading = false,
  initialData,
  currentUserId,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [error, setError] = useState<ErrorKind | null>(null);

  useEffect(() => {
    setTitle(initialData?.title ?? "");
    setDescription(initialData?.description ?? "");
    setError(null);
  }, [initialData]);

  const handleSubmit = async () => {
    if (!title.trim() || loading) return;
    setError(null);

    // Initial local validation (consistent with AddItemForm)
    if (title.trim().length < MIN_TITLE_LENGTH) {
      setError("nameTooShort");
      return;
    }
    if (title.trim().length > MAX_TITLE_LENGTH) {
      setError("nameTooLong");
      return;
    }

    try {
      await onSubmit({
        id: initialData?.id,
        title: title.trim(),
        description: description.trim() || undefined,
        visibility: initialData?.visibility ?? Visibility.LINK,
        participation: initialData?.participation ?? Participation.ANYONE,
        ownerId: currentUserId,
      });
    } catch (submitError) {
      console.error("Error submitting wishlist form:", submitError);
      setError(classifyError(submitError));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label={t("wishlistForm.titleLabel")}
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          if (isNameError(error)) {
            setError(null);
          }
        }}
        mode="outlined"
        placeholder={t("wishlistForm.titlePlaceholder")}
        error={isNameError(error)}
        disabled={loading}
      />

      <TextInput
        label={t("wishlistForm.descriptionLabel")}
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={4}
        placeholder={t("wishlistForm.descriptionPlaceholder")}
        disabled={loading}
        style={styles.description}
      />

      {error && (
        <HelperText type="error" style={styles.errorText}>
          {t(ERROR_MESSAGE_KEYS[error])}
        </HelperText>
      )}

      <Button
        mode="contained"
        onPress={() => {
          void handleSubmit();
        }}
        loading={loading}
        disabled={!title.trim() || loading}
        style={styles.submitButton}
        contentStyle={commonStyles.minimumTouchTarget}
      >
        {initialData?.id ? t("wishlistForm.update") : t("wishlistForm.create")}
      </Button>
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
  },
  description: {
    marginTop: 8,
  },
  submitButton: {
    marginTop: 8,
  },
  errorText: {
    marginTop: 16,
    textAlign: "center",
  },
});
