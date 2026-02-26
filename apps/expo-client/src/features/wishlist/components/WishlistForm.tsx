import React, { useState, useMemo } from "react";
import {
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Visibility, Participation } from "@wishin/domain";
import type { CreateWishlistInput } from "@wishin/domain";
import { useWishlistStyles } from "../hooks/useWishlistStyles";
import { createWishlistFormStyles } from "../styles/WishlistForm.styles";

interface WishlistFormProps {
  onSubmit: (data: CreateWishlistInput & { id?: string }) => Promise<void>;
  loading?: boolean;
  initialData?: Partial<CreateWishlistInput> & { id?: string };
  currentUserId: string;
}

/**
 * Form component for creating and editing wishlist details.
 */
export const WishlistForm: React.FC<WishlistFormProps> = ({
  onSubmit,
  loading = false,
  initialData,
  currentUserId,
}) => {
  const { theme } = useWishlistStyles();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );

  const handleSubmit = () => {
    if (!title.trim() || loading) return;

    void onSubmit({
      id: initialData?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      visibility: initialData?.visibility ?? Visibility.LINK,
      participation: initialData?.participation ?? Participation.ANYONE,
      ownerId: currentUserId,
    });
  };

  const formStyles = useMemo(() => createWishlistFormStyles(theme), [theme]);

  return (
    <ScrollView style={{ flex: 1 }}>
      <Text style={formStyles.label}>Title*</Text>
      <TextInput
        style={formStyles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Birthday 2026, Wedding Registry..."
        placeholderTextColor={theme.textMuted}
        accessibilityLabel="Wishlist title"
      />

      <Text style={formStyles.label}>Description (Optional)</Text>
      <TextInput
        style={[formStyles.input, formStyles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Tell people what this list is about..."
        placeholderTextColor={theme.textMuted}
        multiline
        numberOfLines={4}
        accessibilityLabel="Wishlist description"
      />

      <Pressable
        style={[
          formStyles.submitButton,
          (!title.trim() || loading) && formStyles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!title.trim() || loading}
        accessibilityRole="button"
        accessibilityState={{ disabled: !title.trim() || loading }}
      >
        {loading ? (
          <ActivityIndicator color={theme.card} />
        ) : (
          <Text style={formStyles.submitButtonText}>
            {initialData ? "Update Wishlist" : "Create Wishlist"}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
};
