import React, { useCallback } from "react";
import { View, Text, Image, Pressable, Linking, Alert } from "react-native";
import { Priority } from "@wishin/domain";
import type { WishlistItemOutput } from "@wishin/domain";

const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: "LOW",
  [Priority.MEDIUM]: "MEDIUM",
  [Priority.HIGH]: "HIGH",
  [Priority.URGENT]: "URGENT",
};

import type { WishlistStyles } from "../../hooks/useWishlistStyles";

interface WishlistItemCardProps {
  item: WishlistItemOutput;
  styles: WishlistStyles["styles"];
  themedStyles: WishlistStyles["themedStyles"];
}

/**
 * Component to display a single wishlist item as a card.
 *
 * @param props - Component properties.
 * @returns The WishlistItemCard component.
 */
export const WishlistItemCard: React.FC<WishlistItemCardProps> = ({
  item,
  styles,
  themedStyles,
}) => {
  const isCompleted =
    !item.isUnlimited && item.purchasedQuantity >= item.totalQuantity;
  const isReserved =
    !item.isUnlimited &&
    !isCompleted &&
    item.purchasedQuantity + item.reservedQuantity >= item.totalQuantity;

  const handleOpenUrl = useCallback(async (url?: string) => {
    if (!url) return;

    try {
      await Linking.openURL(url);
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        "An unexpected error occurred while trying to open the link.",
      );
      console.error("Failed to open URL:", err);
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

      {/* Overlays */}
      {isCompleted && (
        <View style={[styles.overlay, themedStyles.overlay]}>
          <View style={[styles.badge, themedStyles.completedBadge]}>
            <Text style={[styles.badgeText, themedStyles.badgeText]}>
              COMPLETED
            </Text>
          </View>
        </View>
      )}

      {isReserved && (
        <View style={[styles.overlay, themedStyles.overlay]}>
          <View style={[styles.badge, themedStyles.reservedBadge]}>
            <Text style={[styles.badgeText, themedStyles.badgeText]}>
              RESERVED
            </Text>
          </View>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.itemTitle, themedStyles.text]}>{item.name}</Text>
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

          {item.url && (
            <Pressable
              style={({ pressed }) => [
                styles.linkButton,
                pressed && styles.pressed,
              ]}
              hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
              onPress={() => void handleOpenUrl(item.url)}
              accessibilityLabel={`View Online, ${item.name}`}
              accessibilityRole="link"
            >
              <Text style={[styles.linkText, themedStyles.secondaryText]}>
                View Online
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};
