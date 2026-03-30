import React, { useCallback, useState, useEffect } from "react";
import { View, Linking, Alert, StyleSheet } from "react-native";
import {
  Card,
  Text,
  Button,
  Badge,
  Surface,
  useTheme,
  IconButton,
} from "react-native-paper";
import { type AppTheme } from "../../../theme/theme";
import type { WishlistItemOutput } from "@wishin/domain";
import { useUser } from "../../../contexts/UserContext";
import { useToast } from "../../../contexts/ToastContext";
import { usePurchaseItem } from "../hooks/usePurchaseItem";
import { useUndoPurchase } from "../hooks/useUndoPurchase";
import { LoginSuggestionModal } from "./LoginSuggestionModal";
import { AuthModal } from "../../../components/auth/AuthModal";
import { PRIORITY_LABELS, getPriorityColor } from "../utils/priority";
import { commonStyles } from "../../../theme/common-styles";
import { addAlpha } from "../../../utils/colors";

import { getItemImageSource } from "../utils/images";

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
  const theme = useTheme<AppTheme>();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  const { userId, sessionType, loginAsGuest, isSessionReliable } = useUser();
  const { purchaseItem, loading: purchaseLoading } = usePurchaseItem();
  const { undoPurchase } = useUndoPurchase();
  const { showToast } = useToast();

  const [modalVisible, setModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
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

  const handleUndoPurchase = useCallback(
    async (transactionId: string) => {
      if (!userId) return;

      try {
        await undoPurchase({
          wishlistId,
          transactionId,
          userId,
        });
        showToast("Purchase undone successfully.");
      } catch (err: unknown) {
        Alert.alert(
          "Undo Failed",
          err instanceof Error ? err.message : "Something went wrong",
        );
      }
    },
    [undoPurchase, wishlistId, userId, showToast],
  );

  const executePurchase = useCallback(
    async (buyerId: string) => {
      try {
        const result = await purchaseItem({
          wishlistId,
          itemId: item.id,
          userId: buyerId,
          quantity: 1, // Defaulting to 1 for this UI button
        });

        showToast(`Awesome! You've marked 1 x ${item.name} as purchased.`, {
          onUndo: () => {
            void handleUndoPurchase(result.transactionId);
          },
        });
      } catch (err: unknown) {
        // usePurchaseItem (via useAsyncActionEx) re-throws errors, so we catch them here
        Alert.alert(
          "Purchase Failed",
          err instanceof Error ? err.message : "Something went wrong",
        );
      }
    },
    [
      purchaseItem,
      wishlistId,
      item.id,
      item.name,
      showToast,
      handleUndoPurchase,
    ],
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
        mode="outlined"
      >
        <View style={styles.imageWrapper}>
          <Card.Cover
            source={getItemImageSource(item.imageUrl)}
            accessibilityLabel={item.name}
            style={[styles.cardImage, isCompleted && styles.completedImage]}
            resizeMode="cover"
          />
          <Badge
            size={24}
            style={[
              styles.priorityBadge,
              {
                backgroundColor: getPriorityColor(item.priority, theme),
              },
            ]}
          >
            {PRIORITY_LABELS[item.priority]}
          </Badge>
        </View>

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
            <View style={styles.titleContainer}>
              <Text variant="titleLarge" style={styles.titleText}>
                {item.name}
              </Text>
              {item.url && (
                <IconButton
                  icon="open-in-new"
                  size={18}
                  onPress={() => {
                    void handleOpenUrl(item.url);
                  }}
                  accessibilityLabel={`View Online, ${item.name}`}
                  style={styles.headerLinkIcon}
                />
              )}
            </View>
          </View>

          <View style={styles.descriptionWrapper}>
            {item.description ? (
              <Text
                variant="bodyMedium"
                numberOfLines={2}
                style={styles.description}
              >
                {item.description}
              </Text>
            ) : null}
          </View>

          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              {item.price != null && item.currency != null && (
                <Text variant="titleMedium" style={styles.priceText}>
                  {item.currency} {item.price.toFixed(2)}
                </Text>
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
      <AuthModal
        visible={authModalVisible}
        onDismiss={() => {
          setAuthModalVisible(false);
        }}
      />
    </>
  );
};

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      marginBottom: 24,
      borderRadius: 28,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderColor: theme.colors.outlineVariant,
    },
    completedCard: {
      opacity: 0.9,
    },
    cardContent: {
      paddingTop: 16,
    },
    cardHeader: {
      marginBottom: 4,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 60, // Space for 2 lines of titleLargeVarela
    },
    headerLinkIcon: {
      margin: 0,
      marginRight: -8,
    },
    descriptionWrapper: {
      minHeight: 44, // Space for 2 lines of bodyMedium + margin
      justifyContent: "center",
    },
    description: {
      marginTop: 4,
    },
    overlayContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: addAlpha(theme.colors.inverseSurface, 0.4),
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
      borderRadius: 28, // Updated to match card
    },
    overlayBadge: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    cardImage: {
      margin: 12,
      borderRadius: 22,
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
    overlayLabel: {
      fontWeight: "bold",
    },
    titleText: {
      flex: 1,
      fontFamily: theme.fonts.titleLargeVarela.fontFamily,
      fontWeight: "600",
    },
    imageWrapper: {
      position: "relative",
    },
    priorityBadge: {
      position: "absolute",
      top: 24,
      right: 24,
      zIndex: 2,
    },
    priceContainer: {
      flex: 1,
      justifyContent: "center",
    },
    priceText: {
      fontWeight: "bold",
      color: theme.colors.primary,
    },
  });
