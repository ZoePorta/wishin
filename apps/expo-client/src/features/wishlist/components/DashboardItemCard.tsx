import React, { useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Linking,
  Alert,
  StyleSheet,
} from "react-native";
import { Priority, type WishlistItemOutput } from "@wishin/domain";
import type { WishlistStyles } from "../hooks/useWishlistStyles";
import { PRIORITY_LABELS } from "../utils/priority";

interface DashboardItemCardProps {
  item: WishlistItemOutput;
  commonStyles: WishlistStyles["styles"];
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
  commonStyles,
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
    <View style={[commonStyles.card, themedStyles.card]}>
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={commonStyles.itemImage}
          resizeMode="cover"
          accessibilityLabel={item.name}
        />
      )}

      <View style={commonStyles.cardContent}>
        <View style={commonStyles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text
              accessibilityRole="header"
              style={[commonStyles.itemTitle, themedStyles.text]}
            >
              {item.name}
            </Text>
            <Text style={[themedStyles.textMuted, styles.qtyText]}>
              Qty: {item.isUnlimited ? "∞" : item.totalQuantity}
            </Text>
          </View>
          {item.price != null && item.currency != null && (
            <Text style={[commonStyles.itemPrice, themedStyles.primaryText]}>
              {item.currency} {item.price.toFixed(2)}
            </Text>
          )}
        </View>

        {item.description && (
          <Text
            style={[commonStyles.itemDescription, themedStyles.textMuted]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}

        <View style={commonStyles.cardFooter}>
          <View
            style={[
              commonStyles.priorityBadge,
              item.priority === Priority.HIGH ||
              item.priority === Priority.URGENT
                ? themedStyles.priorityHigh
                : item.priority === Priority.MEDIUM
                  ? themedStyles.priorityMedium
                  : themedStyles.priorityLow,
            ]}
          >
            <Text style={[commonStyles.priorityText, themedStyles.text]}>
              {PRIORITY_LABELS[item.priority]}
            </Text>
          </View>

          <View style={styles.row}>
            {item.url && (
              <Pressable
                style={commonStyles.linkButton}
                onPress={() => {
                  void handleOpenUrl(item.url);
                }}
                accessibilityRole="button"
                accessibilityLabel="Open item link"
              >
                <Text
                  style={[commonStyles.linkText, themedStyles.secondaryText]}
                >
                  Link
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[commonStyles.linkButton, styles.buttonSpacing]}
              onPress={() => {
                onEdit(item);
              }}
              accessibilityLabel={`Edit ${item.name}`}
              accessibilityRole="button"
            >
              <Text style={[commonStyles.linkText, themedStyles.primaryText]}>
                Edit
              </Text>
            </Pressable>

            <Pressable
              style={[commonStyles.linkButton, styles.buttonSpacing]}
              onPress={() => {
                onRemove(item.id);
              }}
              accessibilityLabel={`Delete ${item.name}`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  commonStyles.linkText,
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

const styles = StyleSheet.create({
  titleContainer: {
    flex: 1,
  },
  qtyText: {
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonSpacing: {
    marginLeft: 8,
  },
});
