import React, { useCallback } from "react";
import { View, Linking, Alert, StyleSheet } from "react-native";
import { Card, Text, Button, Badge, useTheme } from "react-native-paper";
import { type WishlistItemOutput } from "@wishin/domain";
import { PRIORITY_LABELS, getPriorityColor } from "../utils/priority";
import { commonStyles } from "../../../theme/common-styles";

interface DashboardItemCardProps {
  item: WishlistItemOutput;
  onEdit: (item: WishlistItemOutput) => void;
  onRemove: (id: string) => void;
}

/**
 * Component to display a single wishlist item in the OWNER's dashboard.
 * Uses Material Design 3 components.
 *
 * @param {DashboardItemCardProps} props - The component props.
 * @param {WishlistItemOutput} props.item - The wishlist item object to display.
 * @param {function} props.onEdit - Callback to handle editing the item.
 * @param {function} props.onRemove - Callback to handle removing the item.
 * @returns {JSX.Element} The rendered dashboard item card.
 */
export const DashboardItemCard: React.FC<DashboardItemCardProps> = ({
  item,
  onEdit,
  onRemove,
}) => {
  const theme = useTheme();

  const handleOpenUrl = useCallback(async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Could not open link.");
    }
  }, []);

  const priorityColor = getPriorityColor(item.priority, theme);

  return (
    <Card style={styles.card} mode="elevated">
      {item.imageUrl && (
        <Card.Cover
          source={{ uri: item.imageUrl }}
          accessibilityLabel={item.name}
        />
      )}
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
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
                backgroundColor: priorityColor,
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
            contentStyle={commonStyles.minimumTouchTarget}
          >
            Link
          </Button>
        )}
        <Button
          mode="text"
          onPress={() => {
            onEdit(item);
          }}
          contentStyle={commonStyles.minimumTouchTarget}
        >
          Edit
        </Button>
        <Button
          mode="text"
          onPress={() => {
            onRemove(item.id);
          }}
          textColor={theme.colors.error}
          contentStyle={commonStyles.minimumTouchTarget}
        >
          Delete
        </Button>
      </Card.Actions>
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
