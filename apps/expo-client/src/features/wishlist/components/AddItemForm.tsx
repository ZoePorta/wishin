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
import { PRIORITY_LABELS, SORTED_PRIORITIES } from "../utils/priority";
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
  const [price, setPrice] = useState("0");
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [totalQuantity, setTotalQuantity] = useState("1");
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [priceUnknown, setPriceUnknown] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || loading) return;

    void onSubmit({
      wishlistId,
      name: name.trim(),
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      price: priceUnknown ? undefined : parseFloat(price) || 0,
      priority,
      totalQuantity: isUnlimited ? 1 : parseInt(totalQuantity, 10) || 1,
      isUnlimited,
    });

    // Reset form after submit
    setName("");
    setDescription("");
    setUrl("");
    setPrice("0");
    setPriority(Priority.MEDIUM);
    setTotalQuantity("1");
    setIsUnlimited(false);
    setPriceUnknown(false);
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
            style={[formStyles.input, priceUnknown && formStyles.inputDisabled]}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            editable={!priceUnknown}
            placeholderTextColor={theme.textMuted}
          />
          <Pressable
            style={formStyles.checkboxContainer}
            onPress={() => {
              setPriceUnknown(!priceUnknown);
            }}
          >
            <View
              style={[
                formStyles.checkbox,
                priceUnknown && formStyles.checkboxChecked,
              ]}
            >
              {priceUnknown && <View style={formStyles.checkmark} />}
            </View>
            <Text style={formStyles.checkboxLabel}>I don't know the price</Text>
          </Pressable>
        </View>
        <View style={formStyles.flex1}>
          <Text style={formStyles.label}>Quantity</Text>
          <TextInput
            style={[formStyles.input, isUnlimited && formStyles.inputDisabled]}
            value={totalQuantity}
            onChangeText={setTotalQuantity}
            keyboardType="number-pad"
            editable={!isUnlimited}
            placeholderTextColor={theme.textMuted}
          />
          <Pressable
            style={formStyles.checkboxContainer}
            onPress={() => {
              setIsUnlimited(!isUnlimited);
            }}
          >
            <View
              style={[
                formStyles.checkbox,
                isUnlimited && formStyles.checkboxChecked,
              ]}
            >
              {isUnlimited && <View style={formStyles.checkmark} />}
            </View>
            <Text style={formStyles.checkboxLabel}>Unlimited</Text>
          </Pressable>
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
        {SORTED_PRIORITIES.map((p) => (
          <Pressable
            key={p}
            style={[
              formStyles.priorityButton,
              priority === p && formStyles.priorityActive,
            ]}
            onPress={() => {
              setPriority(p);
            }}
          >
            <Text
              style={[
                formStyles.priorityText,
                priority === p && formStyles.priorityTextActive,
              ]}
            >
              {PRIORITY_LABELS[p]}
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
