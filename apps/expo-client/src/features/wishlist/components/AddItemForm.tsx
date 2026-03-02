import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { Priority, type WishlistItemOutput } from "@wishin/domain";
import type { AddWishlistItemInput } from "@wishin/domain";
import { PRIORITY_LABELS, SORTED_PRIORITIES } from "../utils/priority";
import { useWishlistStyles } from "../hooks/useWishlistStyles";
import { createAddItemFormStyles } from "../styles/AddItemForm.styles";
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "../utils/currencies";

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
  const [currency, setCurrency] = useState(
    initialData?.currency ?? DEFAULT_CURRENCY,
  );
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
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || loading) return;

    const payload: AddItemFormSubmission = {
      wishlistId,
      name: name.trim(),
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      price: priceUnknown ? undefined : parseFloat(price) || 0,
      currency: priceUnknown ? undefined : currency,
      priority,
      totalQuantity: isUnlimited ? 1 : parseInt(totalQuantity, 10) || 1,
      isUnlimited,
      imageUrl: initialData?.imageUrl,
      id: initialData?.id,
    };

    await onSubmit(payload);
  }, [
    name,
    loading,
    wishlistId,
    description,
    url,
    priceUnknown,
    price,
    currency,
    priority,
    isUnlimited,
    totalQuantity,
    initialData?.imageUrl,
    initialData?.id,
    onSubmit,
  ]);

  const formStyles = useMemo(() => createAddItemFormStyles(theme), [theme]);

  // TODO: Set default currency based on user location or preferences
  return (
    <View style={formStyles.container}>
      <Text style={formStyles.title}>
        {initialData ? "Edit Item" : "Add New Item"}
      </Text>

      {/* TODO: Implement Image Upload integration for items */}

      <Text style={formStyles.label}>Name*</Text>
      <TextInput
        style={formStyles.input}
        value={name}
        onChangeText={setName}
        placeholder="Product name..."
        placeholderTextColor={theme.textMuted}
        accessibilityLabel="Item name"
      />

      <Text style={formStyles.label}>Description</Text>
      <TextInput
        style={[formStyles.input, formStyles.multilineInput]}
        value={description}
        onChangeText={setDescription}
        placeholder="Product description..."
        multiline
        placeholderTextColor={theme.textMuted}
        accessibilityLabel="Item description"
      />

      <View style={formStyles.row}>
        <View style={formStyles.flex1}>
          <Text style={formStyles.label}>Price</Text>
          <View style={formStyles.priceRow}>
            <TextInput
              style={[
                formStyles.input,
                formStyles.flex1,
                priceUnknown && formStyles.inputDisabled,
              ]}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              editable={!priceUnknown}
              placeholderTextColor={theme.textMuted}
              accessibilityLabel="Item price"
            />
            <Pressable
              disabled={priceUnknown}
              style={[
                formStyles.currencyPicker,
                priceUnknown && formStyles.inputDisabled,
              ]}
              onPress={() => {
                setIsCurrencyModalVisible(true);
              }}
              accessibilityLabel="Select currency"
              accessibilityRole="combobox"
            >
              <Text style={formStyles.currencyText}>{currency}</Text>
            </Pressable>
          </View>

          <Pressable
            style={formStyles.checkboxContainer}
            onPress={() => {
              setPriceUnknown(!priceUnknown);
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: priceUnknown }}
            accessibilityLabel="Price unknown"
          >
            <View style={formStyles.checkbox}>
              <View
                style={[
                  formStyles.checkboxVisual,
                  priceUnknown && formStyles.checkboxVisualChecked,
                ]}
              >
                {priceUnknown && <View style={formStyles.checkmark} />}
              </View>
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
            accessibilityLabel="Item quantity"
          />
          <Pressable
            style={formStyles.checkboxContainer}
            onPress={() => {
              setIsUnlimited(!isUnlimited);
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isUnlimited }}
            accessibilityLabel="Unlimited quantity"
          >
            <View style={formStyles.checkbox}>
              <View
                style={[
                  formStyles.checkboxVisual,
                  isUnlimited && formStyles.checkboxVisualChecked,
                ]}
              >
                {isUnlimited && <View style={formStyles.checkmark} />}
              </View>
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
        accessibilityLabel="Item link URL"
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
            accessibilityRole="button"
            accessibilityState={{ selected: priority === p }}
            accessibilityLabel={`${PRIORITY_LABELS[p]} priority`}
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
        accessibilityRole="button"
        accessibilityState={{ disabled: !name.trim() || loading }}
      >
        {loading ? (
          <ActivityIndicator color={theme.card} />
        ) : (
          <Text style={formStyles.submitButtonText}>
            {initialData ? "Save Changes" : "Add to List"}
          </Text>
        )}
      </Pressable>

      {/* Currency Selection Modal */}
      <Modal
        visible={isCurrencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsCurrencyModalVisible(false);
        }}
      >
        <Pressable
          style={formStyles.modalOverlay}
          onPress={() => {
            setIsCurrencyModalVisible(false);
          }}
        >
          <View style={formStyles.modalContent}>
            <FlatList
              data={SUPPORTED_CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    formStyles.currencyOption,
                    currency === item.code && formStyles.currencyOptionSelected,
                  ]}
                  onPress={() => {
                    setCurrency(item.code);
                    setIsCurrencyModalVisible(false);
                  }}
                >
                  <Text style={formStyles.currencyOptionText}>
                    {item.name} ({item.code})
                  </Text>
                  {currency === item.code && (
                    <Text style={formStyles.currencyOptionText}>✓</Text>
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};
