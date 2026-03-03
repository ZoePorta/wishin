import React, { useCallback } from "react";
import { View, Linking, Alert, StyleSheet } from "react-native";
import {
  Card,
  Text,
  Button,
  Badge,
  Surface,
  useTheme,
} from "react-native-paper";
import type { WishlistItemOutput } from "@wishin/domain";
import { PRIORITY_LABELS, getPriorityColor } from "../utils/priority";

interface PublicItemCardProps {
  item: WishlistItemOutput;
}

/**
 * Component to display a single wishlist item to VISITORS.
 * Uses Material Design 3 components.
 *
 * @param {PublicItemCardProps} props - The component props.
 * @param {WishlistItemOutput} props.item - The wishlist item object to display.
 * @returns {JSX.Element} The rendered public item card.
 */
export const PublicItemCard: React.FC<PublicItemCardProps> = ({ item }) => {
  const theme = useTheme();
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
    } catch {
      Alert.alert("Error", "Could not open link.");
    }
  }, []);

  return (
    <Card style={styles.card} mode="elevated">
      {item.imageUrl && (
        <Card.Cover
          source={{ uri: item.imageUrl }}
          accessibilityLabel={item.name}
        />
      )}

      {(isCompleted || isReserved) && (
        <View style={styles.overlayContainer}>
          <Surface
            style={[
              styles.overlayBadge,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
            elevation={2}
          >
            <Text variant="labelLarge" style={styles.overlayLabel}>
              {isCompleted ? "COMPLETED" : "RESERVED"}
            </Text>
          </Surface>
        </View>
      )}

      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text variant="titleLarge" style={styles.titleText}>
            {item.name}
          </Text>
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

        <View style={styles.footer}>
          <Badge
            size={20}
            style={[
              styles.badge,
              {
                backgroundColor: getPriorityColor(item.priority, theme),
              },
            ]}
          >
            {PRIORITY_LABELS[item.priority]}
          </Badge>

          {item.url && (
            <Button
              mode="text"
              onPress={() => void handleOpenUrl(item.url)}
              accessibilityLabel={`View Online, ${item.name}`}
            >
              View Online
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  cardContent: {
    paddingTop: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  description: {
    marginTop: 8,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    borderRadius: 12,
  },
  overlayBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  badge: {
    alignSelf: "flex-start",
  },
  overlayLabel: {
    fontWeight: "bold",
  },
  titleText: {
    flex: 1,
  },
});
