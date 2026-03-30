import React, { useCallback } from "react";
import {
  View,
  Linking,
  Alert,
  StyleSheet,
  Image,
  type ImageSourcePropType,
} from "react-native";
import { Card, Text, Badge, useTheme, IconButton } from "react-native-paper";
import { type AppTheme } from "../../../theme/theme";
import { type WishlistItemOutput } from "@wishin/domain";
import { PRIORITY_LABELS, getPriorityColor } from "../utils/priority";
import { Config } from "../../../constants/Config";
// @ts-expect-error - New asset might not be indexed by TS yet
import ITEM_IMAGE_PLACEHOLDER from "../../../../assets/images/item_image_placeholder.png";

interface DashboardItemCardProps {
  item: WishlistItemOutput;
  onEdit: (item: WishlistItemOutput) => void;
  onRemove: (id: string) => void;
  onPress: (item: WishlistItemOutput) => void;
}

/**
 * Component to display a single wishlist item in the OWNER's dashboard.
 * Uses Material Design 3 components.
 *
 * @param {DashboardItemCardProps} props - The component props.
 * @param {WishlistItemOutput} props.item - The wishlist item object to display.
 * @param {function} props.onEdit - Callback to handle editing the item.
 * @param {function} props.onRemove - Callback to handle removing the item.
 * @param {function} props.onPress - Callback invoked when the card is pressed. Receives the {@link WishlistItemOutput} item.
 * @returns {JSX.Element} The rendered dashboard item card.
 */
export const DashboardItemCard: React.FC<DashboardItemCardProps> = ({
  item,
  onEdit,
  onRemove,
  onPress,
}) => {
  const theme = useTheme<AppTheme>();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);

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
    <Card
      style={styles.card}
      mode="outlined"
      onPress={() => {
        onPress(item);
      }}
    >
      <View style={styles.mainRow}>
        <View style={styles.imageWrapper}>
          <Image
            source={
              item.imageUrl
                ? {
                    uri: item.imageUrl.startsWith("/")
                      ? `${Config.baseUrl}${item.imageUrl}`
                      : item.imageUrl,
                  }
                : (ITEM_IMAGE_PLACEHOLDER as unknown as ImageSourcePropType)
            }
            accessibilityLabel={item.name}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoTopHeader}>
            <View style={styles.titleContainer}>
              <View style={styles.nameRow}>
                <Text
                  variant="titleMedium"
                  numberOfLines={1}
                  style={styles.nameText}
                  onPress={
                    item.url ? () => void handleOpenUrl(item.url) : undefined
                  }
                >
                  {item.name}
                </Text>
                {item.url && (
                  <IconButton
                    icon="open-in-new"
                    size={16}
                    style={styles.linkIcon}
                    onPress={() => {
                      void handleOpenUrl(item.url);
                    }}
                    accessibilityLabel="Open link"
                  />
                )}
              </View>
              <Text variant="bodySmall" style={styles.qtyText}>
                Qty: {item.isUnlimited ? "∞" : item.totalQuantity}
              </Text>
            </View>
            <Badge
              size={18}
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

          {item.price != null && item.currency != null && (
            <Text variant="titleMedium" style={styles.priceText}>
              {item.currency} {item.price.toFixed(2)}
            </Text>
          )}

          <View style={styles.actionIcons}>
            <IconButton
              icon="pencil-outline"
              size={20}
              onPress={() => {
                onEdit(item);
              }}
              accessibilityLabel="Edit item"
            />
            <IconButton
              icon="trash-can-outline"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => {
                onRemove(item.id);
              }}
              accessibilityLabel="Delete item"
            />
          </View>
        </View>
      </View>
    </Card>
  );
};

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      marginBottom: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderColor: theme.colors.outlineVariant,
      overflow: "visible",
      maxWidth: 800,
      width: "100%",
      alignSelf: "center",
    },
    mainRow: {
      flexDirection: "row",
      padding: 12,
      minHeight: 120,
    },
    infoContainer: {
      flex: 1,
      marginLeft: 12,
    },
    infoTopHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    titleContainer: {
      flex: 1,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    nameText: {
      flex: 1,
    },
    linkIcon: {
      margin: 0,
      marginLeft: 4,
    },
    qtyText: {
      marginTop: 0,
      opacity: 0.7,
    },
    actionIcons: {
      position: "absolute",
      right: -10,
      bottom: -10,
      flexDirection: "row",
    },
    priceText: {
      fontWeight: "700",
      color: theme.colors.primary,
    },
    badge: {
      alignSelf: "flex-start",
    },
    imageWrapper: {
      width: 100,
      height: 100,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.colors.surfaceVariant,
    },
    image: {
      width: "100%",
      height: "100%",
    },
  });
