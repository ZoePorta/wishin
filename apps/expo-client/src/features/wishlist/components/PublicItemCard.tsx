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
import { useMemo } from "react";
import type { WishlistStyles } from "../hooks/useWishlistStyles";

interface PublicItemCardProps {
  item: WishlistItemOutput;
  styles: WishlistStyles["styles"];
}

/**
 * Component to display a single wishlist item to VISITORS.
 * Uses Material Design 3 components.
 */
export const PublicItemCard: React.FC<PublicItemCardProps> = ({
  item,
  styles,
}) => {
  const theme = useTheme();
  const isCompleted =
    !item.isUnlimited && item.purchasedQuantity >= item.totalQuantity;
  const isReserved =
    !item.isUnlimited &&
    !isCompleted &&
    item.purchasedQuantity + item.reservedQuantity >= item.totalQuantity;

  const localStyles = useMemo(() => {
    return StyleSheet.create({
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
        backgroundColor: theme.colors.surface,
      },
      badgeText: {
        fontWeight: "bold",
        color: theme.colors.onSurface,
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
    });
  }, [theme]);

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
        <View style={localStyles.overlayContainer}>
          <Surface style={localStyles.overlayBadge} elevation={2}>
            <Text variant="labelLarge" style={localStyles.badgeText}>
              {isCompleted ? "COMPLETED" : "RESERVED"}
            </Text>
          </Surface>
        </View>
      )}

      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text variant="titleLarge" style={{ flex: 1 }}>
            {item.name}
          </Text>
          {item.price != null && item.currency != null && (
            <Text variant="titleMedium">
              {item.currency} {item.price.toFixed(2)}
            </Text>
          )}
        </View>

        {item.description && (
          <Text variant="bodyMedium" numberOfLines={2} style={{ marginTop: 8 }}>
            {item.description}
          </Text>
        )}

        <View style={localStyles.footer}>
          <Badge
            size={20}
            style={[
              localStyles.badge,
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
