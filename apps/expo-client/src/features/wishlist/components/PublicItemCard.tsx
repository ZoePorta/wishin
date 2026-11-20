import React, { useCallback, useState, useEffect } from "react";
import { View, Linking, StyleSheet } from "react-native";
import { UniversalAlert as Alert } from "../../../utils/Alert";
import {
  Card,
  Text,
  Button,
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
import { getItemImageSource } from "../utils/images";
import { commonStyles } from "../../../theme/common-styles";
import { addAlpha } from "../../../utils/colors";
import { PriorityBadge } from "./PriorityBadge";
import { ItemDetailModal } from "./ItemDetailModal";
import { useTranslation } from "react-i18next";
import { mapErrorToMessage } from "../utils/error-mapper";

interface PublicItemCardProps {
  item: WishlistItemOutput;
  wishlistId: string;
  hasShownSuggestion: boolean;
  onSuggestionShown: () => void;
  /** Whether the current user is the owner of the wishlist. */
  isOwner: boolean;
  /** Whether the owner has revealed spoilers. */
  isSpoilerRevealed: boolean;
  /**
   * Called after a purchase or undo succeeded with the item state to show now
   * (`next`) and the state the server still has (`previous`), so the screen can
   * update optimistically while the server syncs. May fire after the card
   * unmounted (undo from the toast once the item is gone).
   */
  onItemChanged?: (
    next: WishlistItemOutput,
    previous: WishlistItemOutput,
  ) => void;
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
 * @param {Function} [props.onItemChanged] - Called with `(next, previous)` item states after a successful purchase or undo.
 * @returns {JSX.Element | null} The rendered public item card, or null if hidden.
 */
export const PublicItemCard: React.FC<PublicItemCardProps> = ({
  item,
  wishlistId,
  hasShownSuggestion,
  onSuggestionShown,
  isOwner,
  isSpoilerRevealed,
  onItemChanged,
}) => {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  const { userId, sessionType, loginAsGuest, isSessionReliable } = useUser();
  const { purchaseItem, loading: purchaseLoading } = usePurchaseItem();
  const { undoPurchase } = useUndoPurchase();
  const { showToast } = useToast();

  const [modalVisible, setModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);

  const isCompleted =
    !item.isUnlimited && item.purchasedQuantity >= item.totalQuantity;

  const isReserved =
    !item.isUnlimited &&
    !isCompleted &&
    item.reservedQuantity + item.purchasedQuantity >= item.totalQuantity;

  // Guests see what is still available, not the total requested.
  // Only show the multiplier when it adds information (unlimited or more than one left).
  const showQuantity = item.isUnlimited || item.availableQuantity > 1;

  // Completed items are hidden globally from the list (ADR 028)
  // They are only visible to the owner if they have explicitly revealed spoilers.
  if (isCompleted && !(isOwner && isSpoilerRevealed)) {
    return null;
  }

  const handleOpenUrl = useCallback(
    async (url?: string) => {
      if (!url) return;

      const trimmedUrl = url.trim();

      try {
        // Validate scheme
        const lowerUrl = trimmedUrl.toLowerCase();
        if (
          !lowerUrl.startsWith("http://") &&
          !lowerUrl.startsWith("https://")
        ) {
          Alert.alert(t("common.error"), t("item.links.onlyWeb"));
          return;
        }

        const supported = await Linking.canOpenURL(trimmedUrl);
        if (supported) {
          await Linking.openURL(trimmedUrl);
        } else {
          Alert.alert(
            t("common.error"),
            t("item.links.cannotOpen", { url: trimmedUrl }),
          );
        }
      } catch (error) {
        console.error("Failed to open item link:", error);
        Alert.alert(
          t("common.error"),
          t("item.links.cannotOpen", { url: trimmedUrl }),
        );
      }
    },
    [t],
  );

  const handleUndoPurchase = useCallback(
    async (
      transactionId: string,
      purchased: WishlistItemOutput | undefined,
      beforePurchase: WishlistItemOutput,
    ) => {
      if (!userId) return;

      try {
        await undoPurchase({
          wishlistId,
          transactionId,
          userId,
        });
        showToast(t("item.purchase.undone"));
        // Restore the pre-purchase state; the server still has the purchased one.
        if (purchased) onItemChanged?.(beforePurchase, purchased);
      } catch (err: unknown) {
        console.error("Failed to undo purchase:", err);
        Alert.alert(
          t("item.purchase.undoFailedTitle"),
          mapErrorToMessage(err, t),
        );
      }
    },
    [undoPurchase, wishlistId, userId, showToast, t, onItemChanged],
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

        // The use case returns the domain-validated post-purchase state (ADR 025).
        const purchased = result.wishlist.items.find((i) => i.id === item.id);
        const beforePurchase = item;

        showToast(t("item.purchase.success", { name: item.name }), {
          onUndo: () => {
            void handleUndoPurchase(
              result.transactionId,
              purchased,
              beforePurchase,
            );
          },
        });
        if (purchased) onItemChanged?.(purchased, beforePurchase);
      } catch (err: unknown) {
        // usePurchaseItem (via useAsyncActionEx) re-throws errors, so we catch them here
        console.error("Failed to purchase item:", err);
        Alert.alert(t("item.purchase.failedTitle"), mapErrorToMessage(err, t));
      }
    },
    [
      purchaseItem,
      wishlistId,
      item,
      showToast,
      handleUndoPurchase,
      t,
      onItemChanged,
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
      Alert.alert(t("common.error"), t("item.purchase.guestSessionFailed"));
    } finally {
      setGuestLoading(false);
    }
  }, [loginAsGuest, userId, t]);

  const isPurchaseDisabled =
    isCompleted || isReserved || isOwner || purchaseLoading;

  return (
    <>
      <Card
        style={[styles.card, isCompleted && styles.completedCard]}
        mode="outlined"
        onPress={() => {
          setDetailVisible(true);
        }}
        accessibilityLabel={t("item.detailsA11y", { name: item.name })}
      >
        <View style={styles.imageWrapper}>
          <Card.Cover
            source={getItemImageSource(item.imageUrl)}
            accessibilityLabel={item.name}
            style={[styles.cardImage, isCompleted && styles.completedImage]}
            resizeMode="cover"
          />
          <View style={styles.priorityBadge}>
            <PriorityBadge priority={item.priority} size={24} />
          </View>
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
                {t("item.reserved")}
              </Text>
            </Surface>
          </View>
        )}

        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              {/* Name truncates to one line; the quantity never shrinks. */}
              <Text
                variant="titleLarge"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.titleText}
              >
                {item.name}
              </Text>
              {showQuantity && (
                <Text variant="titleSmall" style={styles.quantityText}>
                  {t("item.quantityMultiplier", {
                    quantity: item.isUnlimited ? "∞" : item.availableQuantity,
                  })}
                </Text>
              )}
              <View style={styles.titleSpacer} />
              {item.url && (
                <IconButton
                  icon="open-in-new"
                  size={18}
                  onPress={() => {
                    void handleOpenUrl(item.url);
                  }}
                  accessibilityLabel={t("item.viewOnlineA11y", {
                    name: item.name,
                  })}
                  style={styles.headerLinkIcon}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
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
                  {t("item.price", {
                    symbol: item.currency,
                    amount: item.price,
                  })}
                </Text>
              )}
            </View>

            <Button
              mode="contained"
              onPress={() => {
                void handlePurchasePress();
              }}
              disabled={isPurchaseDisabled}
              loading={purchaseLoading}
              contentStyle={commonStyles.minimumTouchTarget}
              icon="gift-outline"
            >
              {t("item.gotIt")}
            </Button>
          </View>
        </Card.Content>
      </Card>

      <ItemDetailModal
        visible={detailVisible}
        item={item}
        onDismiss={() => {
          setDetailVisible(false);
        }}
        quantityMode="available"
        onOpenUrl={(url) => {
          void handleOpenUrl(url);
        }}
        footerAction={
          <Button
            mode="contained"
            onPress={() => {
              setDetailVisible(false);
              void handlePurchasePress();
            }}
            disabled={isPurchaseDisabled}
            loading={purchaseLoading}
            icon="gift-outline"
          >
            {t("item.gotIt")}
          </Button>
        }
      />
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
      minHeight: 44, // Fixed single-line title keeps grid cards aligned
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
      borderRadius: 28,
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
      flexShrink: 1,
      fontFamily: theme.fonts.titleLargeVarela.fontFamily,
    },
    quantityText: {
      flexShrink: 0,
      marginLeft: 6,
      color: theme.colors.onSurfaceVariant,
    },
    titleSpacer: {
      flex: 1,
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
