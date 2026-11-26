import React from "react";
import { View, StyleSheet, ScrollView, Image, Linking } from "react-native";
import { UniversalAlert as Alert } from "../../../utils/Alert";
import {
  Modal,
  Portal,
  Text,
  Button,
  IconButton,
  useTheme,
  Surface,
} from "react-native-paper";
import { type WishlistItemOutput } from "@wishin/domain";
import { type AppTheme } from "../../../theme/theme";
import { getItemImageSource } from "../utils/images";
import { commonStyles } from "../../../theme/common-styles";
import { PriorityBadge } from "./PriorityBadge";
import { PRIORITY_LABEL_KEYS } from "../utils/priority";
import { useTranslation } from "react-i18next";

/**
 * Props for the {@link ItemDetailModal} component.
 *
 * @interface ItemDetailModalProps
 * @property {boolean} visible - Whether the modal is currently shown.
 * @property {WishlistItemOutput | null} item - The wishlist item being displayed, or null if none.
 * @property {() => void} onDismiss - Callback invoked when the modal should be closed.
 * @property {(item: WishlistItemOutput) => void} [onEdit] - Callback invoked when the user requests to edit the item. When omitted, the edit button is hidden (guest view).
 * @property {"total" | "available"} [quantityMode] - Which quantity to show: the total requested (owner) or what is still available (guest). Defaults to "total".
 * @property {(url: string) => void} [onOpenUrl] - Custom link handler (e.g. with scheme validation). Defaults to `Linking.openURL`.
 * @property {React.ReactNode} [footerAction] - Extra primary action rendered in the footer before the close button (e.g. the guest "got it!" button).
 */
interface ItemDetailModalProps {
  visible: boolean;
  item: WishlistItemOutput | null;
  onDismiss: () => void;
  onEdit?: (item: WishlistItemOutput) => void;
  quantityMode?: "total" | "available";
  onOpenUrl?: (url: string) => void;
  footerAction?: React.ReactNode;
}

/**
 * Modal to display full details of a wishlist item.
 * Used by the owner dashboard (with edit action, total quantity) and by the
 * public wishlist view (with purchase action, available quantity).
 *
 * @param {ItemDetailModalProps} props - The component props.
 * @returns {JSX.Element} The rendered detail modal.
 */
export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  visible,
  item,
  onDismiss,
  onEdit,
  quantityMode = "total",
  onOpenUrl,
  footerAction,
}) => {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);

  const handleOpenUrl = React.useCallback(async () => {
    if (!item?.url) return;
    if (onOpenUrl) {
      onOpenUrl(item.url);
      return;
    }
    try {
      await Linking.openURL(item.url);
    } catch {
      Alert.alert(t("common.error"), t("item.links.couldNotOpen"));
    }
  }, [item?.url, onOpenUrl, t]);

  if (!item) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContent,
          commonStyles.modalContent,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.header}>
          <Text
            variant="headlineSmall"
            style={[styles.headerTitle, { color: theme.colors.onSurface }]}
          >
            {item.name}
          </Text>
          <IconButton
            icon="close"
            onPress={onDismiss}
            accessibilityLabel={t("item.closeDetailsA11y")}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Surface style={styles.imageContainer} elevation={1}>
            <Image
              source={getItemImageSource(item.imageUrl)}
              accessibilityLabel={item.name}
              style={styles.image}
              resizeMode="cover"
            />
          </Surface>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              {item.url && (
                <Button
                  mode="outlined"
                  icon="open-in-new"
                  onPress={() => {
                    void handleOpenUrl();
                  }}
                  style={styles.linkButton}
                >
                  {t("item.viewOnline")}
                </Button>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="labelLarge" style={styles.statLabel}>
                  {t("item.priceLabel")}
                </Text>
                <Text
                  variant="titleLarge"
                  style={{ color: theme.colors.primary }}
                >
                  {item.price != null
                    ? t("item.price", {
                        symbol: item.currency ?? "",
                        amount: item.price,
                      })
                    : t("item.priceUnknown")}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="labelLarge" style={styles.statLabel}>
                  {quantityMode === "available"
                    ? t("item.availableLabel")
                    : t("item.quantityLabel")}
                </Text>
                {item.isUnlimited ? (
                  <Text variant="titleMedium">
                    {t("item.unlimitedQuantity")}
                  </Text>
                ) : (
                  <Text variant="titleLarge">
                    {quantityMode === "available"
                      ? item.availableQuantity
                      : item.totalQuantity}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.priorityRow}>
              <Text variant="labelLarge" style={styles.statLabel}>
                {t("item.priorityLabel")}
              </Text>
              <View style={styles.priorityValue}>
                <PriorityBadge priority={item.priority} size={24} />
                <Text variant="titleSmall">
                  {t(PRIORITY_LABEL_KEYS[item.priority])}
                </Text>
              </View>
            </View>

            {item.description && (
              <View style={styles.descriptionSection}>
                <Text variant="labelLarge" style={styles.statLabel}>
                  {t("item.descriptionLabel")}
                </Text>
                <Text variant="bodyLarge" style={styles.descriptionText}>
                  {item.description}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {onEdit && (
            <Button
              mode="contained"
              onPress={() => {
                onEdit(item);
                onDismiss();
              }}
              style={styles.footerButton}
              icon="pencil"
              contentStyle={commonStyles.minimumTouchTarget}
            >
              {t("item.edit")}
            </Button>
          )}
          {footerAction && (
            <View style={styles.footerButton}>{footerAction}</View>
          )}
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.footerButton}
            contentStyle={commonStyles.minimumTouchTarget}
          >
            {t("common.close")}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContent: {
      marginVertical: 20,
      padding: 24,
      borderRadius: 28,
      maxHeight: "85%",
      maxWidth: 600,
      alignSelf: "center",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    headerTitle: {
      flex: 1,
      fontWeight: "600",
    },
    imageContainer: {
      width: "100%",
      maxWidth: 350,
      aspectRatio: 1.2,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: theme.colors.surfaceVariant,
      marginBottom: 20,
      alignSelf: "center",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    content: {
      paddingBottom: 16,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 16,
    },
    linkButton: {
      alignSelf: "flex-end",
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
      gap: 16,
    },
    statItem: {
      flex: 1,
    },
    statLabel: {
      opacity: 0.6,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    priorityRow: {
      marginBottom: 20,
    },
    priorityValue: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    descriptionSection: {
      marginTop: 8,
    },
    descriptionText: {
      lineHeight: 24,
    },
    footer: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    footerButton: {
      flex: 1,
    },
  });
