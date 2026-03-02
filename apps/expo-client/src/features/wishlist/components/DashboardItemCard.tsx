import React, { useCallback } from "react";
import { View, Linking, Alert, StyleSheet } from "react-native";
import { Card, Text, Button, Badge } from "react-native-paper";
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
 * Uses Material Design 3 components.
 */
export const DashboardItemCard: React.FC<DashboardItemCardProps> = ({
  item,
  commonStyles,
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

  const getPriorityColor = () => {
    switch (item.priority) {
      case Priority.URGENT:
      case Priority.HIGH:
        return "error";
      case Priority.MEDIUM:
        // Material 3 caution/warning is often tertiary or a custom color,
        // using 'tertiary' as a fallback for 'warning' if not defined in standard MD3 colors.
        return "tertiary";
      default:
        return "secondary";
    }
  };

  return (
    <Card style={commonStyles.card} mode="elevated">
      {item.imageUrl && (
        <Card.Cover
          source={{ uri: item.imageUrl }}
          accessibilityLabel={item.name}
        />
      )}
      <Card.Content style={commonStyles.cardContent}>
        <View style={commonStyles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text variant="titleLarge">{item.name}</Text>
            <Text variant="bodySmall">
              Qty: {item.isUnlimited ? "∞" : item.totalQuantity}
            </Text>
          </View>
          {item.price != null && item.currency != null && (
            <Text variant="titleMedium">
              {item.currency} {item.price.toFixed(2)}
            </Text>
          )}
        </View>

        {item.description && (
          <Text
            variant="bodyMedium"
            numberOfLines={2}
            style={styles.description}
          >
            {item.description}
          </Text>
        )}

        <View style={styles.badgeContainer}>
          <Badge
            size={20}
            style={[
              styles.badge,
              {
                backgroundColor:
                  getPriorityColor() === "error" ? "red" : undefined,
              },
            ]}
          >
            {PRIORITY_LABELS[item.priority]}
          </Badge>
        </View>
      </Card.Content>
      <Card.Actions>
        {item.url && (
          <Button
            mode="text"
            onPress={() => {
              void handleOpenUrl(item.url);
            }}
          >
            Link
          </Button>
        )}
        <Button
          mode="text"
          onPress={() => {
            onEdit(item);
          }}
        >
          Edit
        </Button>
        <Button
          mode="text"
          onPress={() => {
            onRemove(item.id);
          }}
          textColor="red"
        >
          Delete
        </Button>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  titleContainer: {
    flex: 1,
  },
  description: {
    marginTop: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    marginTop: 12,
  },
  badge: {
    alignSelf: "flex-start",
  },
});
