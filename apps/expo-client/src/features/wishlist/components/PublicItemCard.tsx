import React, { useCallback } from "react";
import { View, Linking, Alert, StyleSheet } from "react-native";
import {
  Card,
  Text,
  Button,
  Badge,
  Surface,
  useTheme,
  Menu,
  Portal,
  Dialog,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useUser } from "../../../contexts/UserContext";
import { useWishlistItemActions } from "../hooks/useWishlistItemActions";
import type { WishlistItemOutput } from "@wishin/domain";
import { PRIORITY_LABELS, getPriorityColor } from "../utils/priority";
import { commonStyles } from "../../../theme/common-styles";

interface PublicItemCardProps {
  item: WishlistItemOutput;
  wishlistId: string;
}

/**
 * Component to display a single wishlist item to VISITORS.
 * Uses Material Design 3 components.
 *
 * @param {PublicItemCardProps} props - The component props.
 * @param {WishlistItemOutput} props.item - The wishlist item object to display.
 * @returns {JSX.Element} The rendered public item card.
 */
export const PublicItemCard: React.FC<PublicItemCardProps> = ({
  item,
  wishlistId,
}) => {
  const { userId, sessionType, loginAsGuest } = useUser();
  const { purchaseItem, loading } = useWishlistItemActions();
  const router = useRouter();

  const [selectedQuantity, setSelectedQuantity] = React.useState(1);
  const [isMenuVisible, setIsMenuVisible] = React.useState(false);
  const [isGuestModalVisible, setIsGuestModalVisible] = React.useState(false);

  const isCompleted =
    !item.isUnlimited && item.purchasedQuantity >= item.totalQuantity;

  const canPurchase = !isCompleted && item.availableQuantity > 0;
  const showQuantitySelector =
    !item.isUnlimited && item.availableQuantity > 1 && canPurchase;

  const handleOpenUrl = useCallback(async (url?: string) => {
    if (!url) return;

    const trimmedUrl = url.trim();

    try {
      // Validate scheme
      const lowerUrl = trimmedUrl.toLowerCase();
      if (!lowerUrl.startsWith("http://") && !lowerUrl.startsWith("https://")) {
        Alert.alert("Error", "Only web links (http/https) are supported.");
        return;
      }

      const supported = await Linking.canOpenURL(trimmedUrl);
      if (supported) {
        await Linking.openURL(trimmedUrl);
      } else {
        Alert.alert("Error", `Cannot open this link: ${trimmedUrl}`);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        `Could not open link: ${trimmedUrl}. ${error instanceof Error ? error.message : ""}`,
      );
    }
  }, []);

  const executePurchase = useCallback(
    async (resolvedUserId: string) => {
      try {
        await purchaseItem({
          wishlistId,
          itemId: item.id,
          userId: resolvedUserId,
          quantity: selectedQuantity,
        });
      } catch (error) {
        Alert.alert(
          "Purchase Failed",
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        );
      }
    },
    [purchaseItem, wishlistId, item.id, selectedQuantity],
  );

  const handlePurchase = useCallback(async () => {
    if (sessionType === "registered" || sessionType === "incomplete") {
      if (userId) {
        await executePurchase(userId);
      }
      return;
    }

    // Otherwise (anonymous or null), show the guest confirmation modal
    setIsGuestModalVisible(true);
  }, [sessionType, userId, executePurchase]);

  const handleContinueAsGuest = useCallback(async () => {
    setIsGuestModalVisible(false);
    try {
      let currentUserId = userId;
      if (!currentUserId || sessionType === null) {
        currentUserId = await loginAsGuest();
      }

      if (currentUserId) {
        await executePurchase(currentUserId);
      }
    } catch (error) {
      Alert.alert(
        "Guest Login Failed",
        error instanceof Error ? error.message : "Could not continue as guest",
      );
    }
  }, [userId, sessionType, loginAsGuest, executePurchase]);

  const handleLoginRedirect = useCallback(() => {
    setIsGuestModalVisible(false);
    router.push("/");
  }, [router]);

  const theme = useTheme();

  return (
    <>
      <Card style={styles.card} mode="elevated">
        {item.imageUrl && (
          <Card.Cover
            source={{ uri: item.imageUrl }}
            accessibilityLabel={item.name}
          />
        )}

        {isCompleted && (
          <View style={styles.overlayContainer}>
            <Surface
              style={[
                styles.overlayBadge,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
              elevation={2}
            >
              <Text variant="labelLarge" style={styles.overlayLabel}>
                COMPLETED
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
                contentStyle={commonStyles.minimumTouchTarget}
              >
                View Online
              </Button>
            )}
          </View>
        </Card.Content>

        {canPurchase && (
          <Card.Actions style={styles.actions}>
            {showQuantitySelector && (
              <Menu
                visible={isMenuVisible}
                onDismiss={() => {
                  setIsMenuVisible(false);
                }}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setIsMenuVisible(true);
                    }}
                    icon="numeric"
                    contentStyle={commonStyles.minimumTouchTarget}
                  >
                    Qty: {selectedQuantity}
                  </Button>
                }
              >
                {Array.from(
                  { length: item.availableQuantity },
                  (_, i) => i + 1,
                ).map((q) => (
                  <Menu.Item
                    key={q}
                    onPress={() => {
                      setSelectedQuantity(q);
                      setIsMenuVisible(false);
                    }}
                    title={q.toString()}
                    trailingIcon={selectedQuantity === q ? "check" : undefined}
                  />
                ))}
              </Menu>
            )}
            <Button
              mode="contained"
              onPress={() => {
                void handlePurchase();
              }}
              loading={loading}
              disabled={loading}
              contentStyle={commonStyles.minimumTouchTarget}
            >
              Got it!
            </Button>
          </Card.Actions>
        )}
      </Card>

      <Portal>
        <Dialog
          visible={isGuestModalVisible}
          onDismiss={() => {
            setIsGuestModalVisible(false);
          }}
          style={styles.dialog}
        >
          <Dialog.Title>Purchase as Guest?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              You are not logged in. You can log in to track your purchases or
              continue as a guest.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button
              onPress={() => {
                handleLoginRedirect();
              }}
              mode="outlined"
              contentStyle={commonStyles.minimumTouchTarget}
            >
              Login / Register
            </Button>
            <Button
              onPress={() => {
                void handleContinueAsGuest();
              }}
              mode="contained"
              contentStyle={commonStyles.minimumTouchTarget}
            >
              Continue as Guest
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
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
  actions: {
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  dialog: {
    borderRadius: 12,
  },
  dialogActions: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
