import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Priority, type WishlistItemOutput } from "@wishin/domain";
import type { AddWishlistItemInput } from "@wishin/domain";
import { PRIORITY_LABELS, SORTED_PRIORITIES } from "../utils/priority";
import { useWishlistStyles } from "../hooks/useWishlistStyles";
import { createAddItemFormStyles } from "../styles/AddItemForm.styles";
import { useMemo } from "react";

interface AddItemFormProps {
  wishlistId: string;
  initialData?: WishlistItemOutput;
  onSubmit: (data: AddWishlistItemInput) => Promise<void>;
  loading?: boolean;
}

/**
 * Form component to add or edit items in a wishlist.
 */
export const AddItemForm: React.FC<AddItemFormProps> = ({
  wishlistId,
  initialData,
  onSubmit,
  loading = false,
}) => {
  const { theme } = useWishlistStyles();
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "0");
  const [priority, setPriority] = useState<Priority>(
    initialData?.priority ?? Priority.MEDIUM,
  );
  const [totalQuantity, setTotalQuantity] = useState(
    initialData?.totalQuantity.toString() ?? "1",
  );
  const [isUnlimited, setIsUnlimited] = useState(
    initialData?.isUnlimited ?? false,
  );
  const [priceUnknown, setPriceUnknown] = useState(initialData?.price == null);

  const handleSubmit = async () => {
    if (!name.trim() || loading) return;

    await onSubmit({
      wishlistId,
      name: name.trim(),
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      price: priceUnknown ? undefined : parseFloat(price) || 0,
      priority,
      totalQuantity: isUnlimited ? 1 : parseInt(totalQuantity, 10) || 1,
      isUnlimited,
      imageUrl: initialData?.imageUrl,
      ...(initialData?.id ? { id: initialData.id } : {}),
    } as AddWishlistItemInput);
  };

  const formStyles = useMemo(() => createAddItemFormStyles(theme), [theme]);

  return (
    <View style={formStyles.container}>
      <Text style={formStyles.title}>
        {initialData ? "Edit Item" : "Add New Item"}
      </Text>

      <Text style={formStyles.label}>Name*</Text>
      <TextInput
        style={formStyles.input}
        value={name}
        onChangeText={setName}
        placeholder="Product name..."
        placeholderTextColor={theme.textMuted}
      />

      <Text style={formStyles.label}>Description</Text>
      <TextInput
        style={[formStyles.input, { height: 80, textAlignVertical: "top" }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Product description..."
        multiline
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
        onPress={() => {
          void handleSubmit();
        }}
        disabled={!name.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.card} />
        ) : (
          <Text style={formStyles.submitButtonText}>
            {initialData ? "Save Changes" : "Add to List"}
          </Text>
        )}
      </Pressable>
    </View>
  );
};
