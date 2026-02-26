import React, { useCallback } from "react";
import { View, Text, Image, Pressable, Linking, Alert } from "react-native";
import { Priority, type WishlistItemOutput } from "@wishin/domain";
import type { WishlistStyles } from "../hooks/useWishlistStyles";
import { PRIORITY_LABELS } from "../utils/priority";

interface DashboardItemCardProps {
  item: WishlistItemOutput;
  styles: WishlistStyles["styles"];
  themedStyles: WishlistStyles["themedStyles"];
  onEdit: (item: WishlistItemOutput) => void;
  onRemove: (id: string) => void;
}

/**
 * Component to display a single wishlist item in the OWNER's dashboard.
 * - No spoilers (overlays for reserved/purchased status).
 * - Includes Edit and Remove buttons.
 */
export const DashboardItemCard: React.FC<DashboardItemCardProps> = ({
  item,
  styles,
  themedStyles,
  onEdit,
  onRemove,
}) => {
  const handleOpenUrl = useCallback(async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Could not open link.");
    }
  }, []);

  return (
    <View style={[styles.card, themedStyles.card]}>
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.itemImage}
          resizeMode="cover"
          accessibilityLabel={item.name}
        />
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, themedStyles.text]}>
              {item.name}
            </Text>
            <Text style={[themedStyles.textMuted, { fontSize: 12 }]}>
              Qty: {item.isUnlimited ? "∞" : item.totalQuantity}
            </Text>
          </View>
          {item.price != null && item.currency != null && (
            <Text style={[styles.itemPrice, themedStyles.primaryText]}>
              {item.currency} {item.price.toFixed(2)}
            </Text>
          )}
        </View>

        {item.description && (
          <Text
            style={[styles.itemDescription, themedStyles.textMuted]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View
            style={[
              styles.priorityBadge,
              item.priority === Priority.HIGH ||
              item.priority === Priority.URGENT
                ? themedStyles.priorityHigh
                : item.priority === Priority.MEDIUM
                  ? themedStyles.priorityMedium
                  : themedStyles.priorityLow,
            ]}
          >
            <Text style={[styles.priorityText, themedStyles.text]}>
              {PRIORITY_LABELS[item.priority]}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {item.url && (
              <Pressable
                style={styles.linkButton}
                onPress={() => {
                  void handleOpenUrl(item.url);
                }}
              >
                <Text style={[styles.linkText, themedStyles.secondaryText]}>
                  Link
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.linkButton, { marginLeft: 8 }]}
              onPress={() => {
                onEdit(item);
              }}
              accessibilityLabel={`Edit ${item.name}`}
              accessibilityRole="button"
            >
              <Text style={[styles.linkText, themedStyles.primaryText]}>
                Edit
              </Text>
            </Pressable>

            <Pressable
              style={[styles.linkButton, { marginLeft: 8 }]}
              onPress={() => {
                onRemove(item.id);
              }}
              accessibilityLabel={`Delete ${item.name}`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.linkText,
                  { color: themedStyles.priorityHigh.backgroundColor },
                ]}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};
