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
import type { WishlistItemOutput } from "@wishin/domain";
import { useUser } from "../../../contexts/UserContext";
import { usePurchaseItem } from "../hooks/usePurchaseItem";
import { LoginSuggestionModal } from "./LoginSuggestionModal";
import { AuthModal } from "../../../components/auth/AuthModal";
import { PRIORITY_LABELS, getPriorityColor } from "../utils/priority";
import { commonStyles } from "../../../theme/common-styles";

interface PublicItemCardProps {
  item: WishlistItemOutput;
  wishlistId: string;
  hasShownSuggestion: boolean;
  onSuggestionShown: () => void;
  /** Whether the current user is the owner of the wishlist. */
  isOwner: boolean;
  /** Whether the owner has revealed spoilers. */
  isSpoilerRevealed: boolean;
}

/**
 * Component to display a single wishlist item to VISITORS (and owners on public view).
 * Uses Material Design 3 components.
 *
 * @param {PublicItemCardProps} props - The component props.
 * @param {WishlistItemOutput} props.item - The wishlist item object to display.
 * @param {string} props.wishlistId - The ID of the wishlist this item belongs to.
 * @param {boolean} props.hasShownSuggestion - Whether the guest suggestion has been shown.
 * @param {() => void} props.onSuggestionShown - Callback when the guest suggestion is shown.
 * @param {boolean} props.isOwner - Whether the current user is the owner.
 * @param {boolean} props.isSpoilerRevealed - Whether spoilers are revealed.
 * @returns {JSX.Element | null} The rendered public item card, or null if hidden.
 */
export const PublicItemCard: React.FC<PublicItemCardProps> = ({
  item,
  wishlistId,
  hasShownSuggestion,
  onSuggestionShown,
  isOwner,
  isSpoilerRevealed,
}) => {
  const theme = useTheme();
  const { userId, sessionType, loginAsGuest, isSessionReliable } = useUser();
  const { purchaseItem, loading: purchaseLoading } = usePurchaseItem();

  const [modalVisible, setModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(false);

  const isCompleted =
    !item.isUnlimited && item.purchasedQuantity >= item.totalQuantity;

  const isReserved =
    !item.isUnlimited &&
    !isCompleted &&
    item.reservedQuantity + item.purchasedQuantity >= item.totalQuantity;

  // Completed items are hidden globally from the list (ADR 028)
  // They are only visible to the owner if they have explicitly revealed spoilers.
  if (isCompleted && !(isOwner && isSpoilerRevealed)) {
    return null;
  }

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
        // usePurchaseItem (via useAsyncActionEx) re-throws errors, so we catch them here
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
    // Guard: if session is not reliable (loading or indeterminate), wait.
    if (!isSessionReliable) return;

    // 1. If no session, show suggestion modal
    if (!userId || !sessionType) {
      setModalVisible(true);
      onSuggestionShown();
      return;
    }

    // 2. If anonymous session, show suggestion modal ONLY ONCE per view
    if (sessionType === "anonymous" && !hasShownSuggestion) {
      setModalVisible(true);
      onSuggestionShown();
      return;
    }

    // 3. If session exists (registered or already suggested guest), proceed
    await executePurchase(userId);
  }, [
    userId,
    sessionType,
    executePurchase,
    hasShownSuggestion,
    onSuggestionShown,
    isSessionReliable,
    isOwner,
  ]);

  const handleContinueAsGuest = useCallback(async () => {
    if (!isSessionReliable) return;

    setGuestLoading(true);
    setPendingPurchase(true);
    setModalVisible(false);
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

        {isReserved && (
          <View style={styles.overlayContainer}>
            <Surface
              style={[
                styles.overlayBadge,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
              elevation={2}
            >
              <Text variant="labelLarge" style={styles.overlayLabel}>
                RESERVED
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
              disabled={isCompleted || isReserved || isOwner || purchaseLoading}
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
          setAuthModalVisible(true);
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

      <AuthModal
        visible={authModalVisible}
        onDismiss={() => {
          setAuthModalVisible(false);
        }}
      />
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
