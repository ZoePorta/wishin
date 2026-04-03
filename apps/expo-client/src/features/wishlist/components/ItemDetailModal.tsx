import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
  Alert,
} from "react-native";
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

/**
 * Props for the {@link ItemDetailModal} component.
 *
 * @interface ItemDetailModalProps
 * @property {boolean} visible - Whether the modal is currently shown.
 * @property {WishlistItemOutput | null} item - The wishlist item being displayed, or null if none.
 * @property {() => void} onDismiss - Callback invoked when the modal should be closed.
 * @property {(item: WishlistItemOutput) => void} onEdit - Callback invoked when the user requests to edit the item.
 */
interface ItemDetailModalProps {
  visible: boolean;
  item: WishlistItemOutput | null;
  onDismiss: () => void;
  onEdit: (item: WishlistItemOutput) => void;
}

/**
 * Modal to display full details of a wishlist item.
 *
 * @param {ItemDetailModalProps} props - The component props.
 * @returns {JSX.Element} The rendered detail modal.
 */
export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  visible,
  item,
  onDismiss,
  onEdit,
}) => {
  const theme = useTheme<AppTheme>();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);

  const handleOpenUrl = React.useCallback(async () => {
    if (!item?.url) return;
    try {
      await Linking.openURL(item.url);
    } catch {
      Alert.alert("Error", "Could not open link.");
    }
  }, [item?.url]);

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
            numberOfLines={1}
            style={[styles.headerTitle, { color: theme.colors.onSurface }]}
          >
            {item.name}
          </Text>
          <IconButton
            icon="close"
            onPress={onDismiss}
            accessibilityLabel="Close item details"
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Surface style={styles.imageContainer} elevation={1}>
            <Image
              source={getItemImageSource(item.imageUrl)}
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
                  Visit Store
                </Button>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="labelLarge" style={styles.statLabel}>
                  Price
                </Text>
                <Text
                  variant="titleLarge"
                  style={{ color: theme.colors.primary }}
                >
                  {item.price != null
                    ? `${item.currency ?? ""} ${item.price.toFixed(2)}`
                    : "Not set"}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="labelLarge" style={styles.statLabel}>
                  Quantity
                </Text>
                <Text variant="titleLarge">
                  {item.isUnlimited ? "∞" : item.totalQuantity}
                </Text>
              </View>
            </View>

            <View style={styles.priorityRow}>
              <Text variant="labelLarge" style={styles.statLabel}>
                Priority
              </Text>
              <PriorityBadge priority={item.priority} size={24} />
            </View>

            {item.description && (
              <View style={styles.descriptionSection}>
                <Text variant="labelLarge" style={styles.statLabel}>
                  Description
                </Text>
                <Text variant="bodyLarge" style={styles.descriptionText}>
                  {item.description}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={() => {
              onEdit(item);
              onDismiss();
            }}
            style={styles.footerButton}
            icon="pencil"
          >
            Edit Item
          </Button>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.footerButton}
          >
            Close
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
