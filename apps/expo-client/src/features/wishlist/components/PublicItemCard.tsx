import React, { useCallback, useState, useEffect } from "react";
import { View, Linking, Alert, StyleSheet } from "react-native";
import {
  Card,
  Text,
  Button,
  Badge,
  Surface,
  useTheme,
  Snackbar,
} from "react-native-paper";
import { useRouter } from "expo-router";
import type { WishlistItemOutput } from "@wishin/domain";
import { useUser } from "../../../contexts/UserContext";
import { usePurchaseItem } from "../hooks/usePurchaseItem";
import { LoginSuggestionModal } from "./LoginSuggestionModal";
import { PRIORITY_LABELS, getPriorityColor } from "../utils/priority";
import { commonStyles } from "../../../theme/common-styles";

interface PublicItemCardProps {
  item: WishlistItemOutput;
  wishlistId: string;
  hasShownSuggestion: boolean;
  onSuggestionShown: () => void;
}

/**
 * Component to display a single wishlist item to VISITORS.
 * Uses Material Design 3 components.
 *
 * @param {PublicItemCardProps} props - The component props.
 * @param {WishlistItemOutput} props.item - The wishlist item object to display.
 * @param {string} props.wishlistId - The ID of the wishlist this item belongs to.
 * @returns {JSX.Element} The rendered public item card.
 */
export const PublicItemCard: React.FC<PublicItemCardProps> = ({
  item,
  wishlistId,
  hasShownSuggestion,
  onSuggestionShown,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const { userId, sessionType, loginAsGuest } = useUser();
  const { purchaseItem, loading: purchaseLoading } = usePurchaseItem();

  const [modalVisible, setModalVisible] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(false);

  const isCompleted =
    !item.isUnlimited && item.purchasedQuantity >= item.totalQuantity;

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
    async (buyerId: string) => {
      try {
        await purchaseItem({
          wishlistId,
          itemId: item.id,
          userId: buyerId,
          quantity: 1, // Defaulting to 1 for this UI button
        });
        setSuccessVisible(true);
      } catch (err: unknown) {
        Alert.alert(
          "Purchase Failed",
          err instanceof Error ? err.message : "Something went wrong",
        );
      }
    },
    [purchaseItem, wishlistId, item.id],
  );

  useEffect(() => {
    if (pendingPurchase && userId && !purchaseLoading) {
      setPendingPurchase(false);
      void executePurchase(userId);
    }
  }, [pendingPurchase, userId, purchaseLoading, executePurchase]);

  const handlePurchasePress = useCallback(async () => {
    // 1. If no session, show suggestion modal
    if (!userId || !sessionType) {
      setModalVisible(true);
      return;
    }

    // 2. If anonymous session, show suggestion modal ONLY ONCE per view
    if (sessionType === "anonymous" && !hasShownSuggestion) {
      setModalVisible(true);
      return;
    }

    // 3. If session exists (registered or already suggested guest), proceed
    await executePurchase(userId);
  }, [userId, sessionType, executePurchase, hasShownSuggestion]);

  const handleContinueAsGuest = useCallback(async () => {
    setGuestLoading(true);
    setPendingPurchase(true);
    setModalVisible(false);
    onSuggestionShown();
    try {
      if (!userId) {
        await loginAsGuest();
      }
      // If we already have userId, useEffect will trigger the purchase
    } catch (_err: unknown) {
      setPendingPurchase(false);
      Alert.alert("Error", "Failed to create guest session.");
    } finally {
      setGuestLoading(false);
    }
  }, [loginAsGuest, userId, onSuggestionShown]);

  return (
    <>
      <Card
        style={[styles.card, isCompleted && styles.completedCard]}
        mode="elevated"
      >
        {item.imageUrl && (
          <Card.Cover
            source={{ uri: item.imageUrl }}
            accessibilityLabel={item.name}
            style={isCompleted ? styles.completedImage : undefined}
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
            <View style={styles.badgeContainer}>
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
                  onPress={() => {
                    void handleOpenUrl(item.url);
                  }}
                  accessibilityLabel={`View Online, ${item.name}`}
                  contentStyle={commonStyles.minimumTouchTarget}
                  compact
                >
                  View Online
                </Button>
              )}
            </View>

            <Button
              mode="contained"
              onPress={() => {
                void handlePurchasePress();
              }}
              disabled={isCompleted || purchaseLoading}
              loading={purchaseLoading}
              contentStyle={commonStyles.minimumTouchTarget}
              icon="gift-outline"
            >
              got it!
            </Button>
          </View>
        </Card.Content>
      </Card>

      <LoginSuggestionModal
        visible={modalVisible}
        onDismiss={() => {
          setModalVisible(false);
        }}
        onLogin={() => {
          setModalVisible(false);
          router.push("/(auth)/login");
        }}
        onGuest={() => {
          void handleContinueAsGuest();
        }}
        loading={guestLoading}
      />

      <Snackbar
        visible={successVisible}
        onDismiss={() => {
          setSuccessVisible(false);
        }}
        duration={3000}
        action={{
          label: "Close",
          onPress: () => {
            setSuccessVisible(false);
          },
        }}
      >
        Item marked as purchased!
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  completedCard: {
    opacity: 0.9,
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
  completedImage: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
