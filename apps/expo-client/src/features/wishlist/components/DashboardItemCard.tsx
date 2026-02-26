import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import type { WishlistItemOutput } from "@wishin/domain";
import type { WishlistStyles } from "../hooks/useWishlistStyles";

interface DashboardItemCardProps {
  item: WishlistItemOutput;
  styles: WishlistStyles["styles"];
  themedStyles: WishlistStyles["themedStyles"];
  onRemove: (id: string) => void;
}

/**
 * Component to display a single wishlist item in the OWNER's dashboard.
 * - No spoilers (overlays for reserved/purchased status).
 * - Always includes a Remove button.
 */
export const DashboardItemCard: React.FC<DashboardItemCardProps> = ({
  item,
  styles,
  themedStyles,
  onRemove,
}) => {
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
          <View style={{ flex: 1 }} /> {/* Spacer */}
          <Pressable
            style={({ pressed }) => [
              styles.linkButton,
              pressed && styles.pressed,
              { paddingHorizontal: 12 },
            ]}
            onPress={() => {
              onRemove(item.id);
            }}
            accessibilityLabel={`Remove ${item.name}`}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.linkText,
                { color: themedStyles.priorityHigh.backgroundColor },
              ]}
            >
              Remove
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
