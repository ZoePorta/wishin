import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";
import { Visibility, Participation } from "@wishin/domain";
import type { CreateWishlistInput } from "@wishin/domain";

interface WishlistFormProps {
  onSubmit: (data: CreateWishlistInput & { id?: string }) => Promise<void>;
  loading?: boolean;
  initialData?: Partial<CreateWishlistInput> & { id?: string };
  currentUserId: string;
}

/**
 * Component for creating and editing wishlist details.
 * Uses Material Design 3 components.
 */
export const WishlistForm: React.FC<WishlistFormProps> = ({
  onSubmit,
  loading = false,
  initialData,
  currentUserId,
}) => {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );

  useEffect(() => {
    setTitle(initialData?.title ?? "");
    setDescription(initialData?.description ?? "");
  }, [initialData]);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label="Title*"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        placeholder="e.g. Birthday 2026"
        error={!title.trim() && title.length > 0}
        disabled={loading}
      />
      <HelperText type="error" visible={!title.trim() && title.length > 0}>
        Title is required
      </HelperText>

      <TextInput
        label="Description (Optional)"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={4}
        placeholder="Tell people what this list is about..."
        disabled={loading}
        style={styles.description}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={!title.trim() || loading}
        style={styles.submitButton}
      >
        {initialData ? "Update Wishlist" : "Create Wishlist"}
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  description: {
    marginTop: 8,
  },
  submitButton: {
    marginTop: 24,
  },
});
