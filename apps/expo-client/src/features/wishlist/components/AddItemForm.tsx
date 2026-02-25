import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Priority } from "@wishin/domain";
import type { AddWishlistItemInput } from "@wishin/domain";
import { useWishlistStyles } from "../hooks/useWishlistStyles";
import { createAddItemFormStyles } from "../styles/AddItemForm.styles";
import { useMemo } from "react";

interface AddItemFormProps {
  wishlistId: string;
  onSubmit: (data: AddWishlistItemInput) => Promise<void>;
  loading?: boolean;
}

/**
 * Form component to add new items to a wishlist.
 */
export const AddItemForm: React.FC<AddItemFormProps> = ({
  wishlistId,
  onSubmit,
  loading = false,
}) => {
  const { theme } = useWishlistStyles();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [totalQuantity, setTotalQuantity] = useState("1");

  const handleSubmit = () => {
    if (!name.trim() || loading) return;

    void onSubmit({
      wishlistId,
      name: name.trim(),
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      price: price ? parseFloat(price) : undefined,
      priority,
      totalQuantity: parseInt(totalQuantity, 10) || 1,
      isUnlimited: false,
    });

    // Reset form after submit
    setName("");
    setDescription("");
    setUrl("");
    setPrice("");
    setPriority(Priority.MEDIUM);
    setTotalQuantity("1");
  };

  const formStyles = useMemo(() => createAddItemFormStyles(theme), [theme]);

  return (
    <View style={formStyles.container}>
      <Text style={formStyles.title}>Add New Item</Text>

      <Text style={formStyles.label}>Name*</Text>
      <TextInput
        style={formStyles.input}
        value={name}
        onChangeText={setName}
        placeholder="Product name..."
        placeholderTextColor={theme.textMuted}
      />

      <View style={formStyles.row}>
        <View style={formStyles.flex1}>
          <Text style={formStyles.label}>Price</Text>
          <TextInput
            style={formStyles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor={theme.textMuted}
          />
        </View>
        <View style={formStyles.flex1}>
          <Text style={formStyles.label}>Quantity</Text>
          <TextInput
            style={formStyles.input}
            value={totalQuantity}
            onChangeText={setTotalQuantity}
            keyboardType="number-pad"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      <Text style={formStyles.label}>Link (URL)</Text>
      <TextInput
        style={formStyles.input}
        value={url}
        onChangeText={setUrl}
        placeholder="https://..."
        keyboardType="url"
        autoCapitalize="none"
        placeholderTextColor={theme.textMuted}
      />

      <Text style={formStyles.label}>Priority</Text>
      <View style={formStyles.priorityGroup}>
        {Object.values(Priority).map((p) => (
          <Pressable
            key={p}
            style={[
              formStyles.priorityButton,
              priority === p && formStyles.priorityActive,
            ]}
            onPress={() => {
              setPriority(p as Priority);
            }}
          >
            <Text
              style={[
                formStyles.priorityText,
                priority === p && formStyles.priorityTextActive,
              ]}
            >
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[
          formStyles.submitButton,
          (!name.trim() || loading) && formStyles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!name.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.card} />
        ) : (
          <Text style={formStyles.submitButtonText}>Add to List</Text>
        )}
      </Pressable>
    </View>
  );
};
