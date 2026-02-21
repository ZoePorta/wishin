import { useLocalSearchParams, Stack } from "expo-router";
import { useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  Linking,
  Pressable,
  useColorScheme,
  Alert,
} from "react-native";
import { Colors } from "@wishin/app/constants/Colors";
import { useWishlist } from "@wishin/app/hooks/useWishlist";
import type { UseWishlistReturn } from "@wishin/app/hooks/useWishlist";
import { Priority } from "@wishin/domain";
import type { WishlistItemOutput } from "@wishin/domain";

const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: "LOW",
  [Priority.MEDIUM]: "MEDIUM",
  [Priority.HIGH]: "HIGH",
  [Priority.URGENT]: "URGENT",
};

/**
 * Display the details of a specific wishlist.

 *
 * @returns The WishlistDetail component.
 */
export default function WishlistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { wishlist, loading, error, refetch }: UseWishlistReturn =
    useWishlist(id);
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const themedStyles = useMemo(() => getThemedStyles(theme), [theme]);

  const ListHeader = useMemo(() => {
    if (!wishlist) return null;
    return (
      <View style={styles.header}>
        <Text style={[styles.wishlistTitle, themedStyles.text]}>
          {wishlist.title}
        </Text>
        {wishlist.description && (
          <Text style={[styles.wishlistDescription, themedStyles.textMuted]}>
            {wishlist.description}
          </Text>
        )}
        <View style={[styles.divider, themedStyles.surfaceMuted]} />
      </View>
    );
  }, [wishlist, themedStyles]);

  const handleOpenUrl = useCallback(async (url?: string) => {
    if (!url) return;

    try {
      await Linking.openURL(url);
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        "An unexpected error occurred while trying to open the link.",
      );
      console.error("Failed to open URL:", err);
    }
  }, []);
  // Hoisted renderItem
  const renderItem = useCallback(
    ({ item }: { item: WishlistItemOutput }) => {
      const isCompleted =
        !item.isUnlimited && item.purchasedQuantity >= item.totalQuantity;
      const isReserved =
        !item.isUnlimited &&
        !isCompleted &&
        item.purchasedQuantity + item.reservedQuantity >= item.totalQuantity;

      return (
        <View style={[styles.card, themedStyles.card]}>
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.itemImage}
              resizeMode="cover"
              accessibilityLabel={item.name}
            />
          )}

          {/* Overlays */}
          {isCompleted && (
            <View style={[styles.overlay, themedStyles.overlay]}>
              <View style={[styles.badge, themedStyles.completedBadge]}>
                <Text style={[styles.badgeText, themedStyles.badgeText]}>
                  COMPLETED
                </Text>
              </View>
            </View>
          )}

          {isReserved && (
            <View style={[styles.overlay, themedStyles.overlay]}>
              <View style={[styles.badge, themedStyles.reservedBadge]}>
                <Text style={[styles.badgeText, themedStyles.badgeText]}>
                  RESERVED
                </Text>
              </View>
            </View>
          )}

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={[styles.itemTitle, themedStyles.text]}>
                {item.name}
              </Text>
              {item.price != null && item.currency != null && (
                <Text style={[styles.itemPrice, themedStyles.primaryText]}>
                  {item.currency} {item.price.toFixed(2)}
                </Text>
              )}
            </View>

            {item.description && (
              <Text
                style={[styles.itemDescription, themedStyles.textMuted]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            )}

            <View style={styles.cardFooter}>
              <View
                style={[
                  styles.priorityBadge,
                  item.priority === Priority.HIGH ||
                  item.priority === Priority.URGENT
                    ? themedStyles.priorityHigh
                    : item.priority === Priority.MEDIUM
                      ? themedStyles.priorityMedium
                      : themedStyles.priorityLow,
                ]}
              >
                <Text style={[styles.priorityText, themedStyles.text]}>
                  {PRIORITY_LABELS[item.priority]}
                </Text>
              </View>

              {item.url && (
                <Pressable
                  style={({ pressed }) => [
                    styles.linkButton,
                    pressed && styles.pressed,
                  ]}
                  hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                  onPress={() => void handleOpenUrl(item.url)}
                  accessibilityLabel={`View Online, ${item.name}`}
                  accessibilityRole="link"
                >
                  <Text style={[styles.linkText, themedStyles.secondaryText]}>
                    View Online
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      );
    },
    [themedStyles, handleOpenUrl],
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, themedStyles.background]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, themedStyles.background]}>
        <Text style={[styles.errorText, themedStyles.textMuted]}>{error}</Text>
        <Pressable
          onPress={() => void refetch()}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Retry loading wishlist"
        >
          <Text style={[styles.retryText, themedStyles.primaryText]}>
            Tap to Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!wishlist) {
    return (
      <View style={[styles.centerContainer, themedStyles.background]}>
        <Text style={[styles.errorText, themedStyles.textMuted]}>
          Wishlist not found.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: wishlist.title }} />
      <FlatList
        contentContainerStyle={[styles.listContent, themedStyles.background]}
        data={wishlist.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, themedStyles.textMuted]}>
              No items in this wishlist.
            </Text>
          </View>
        }
        style={themedStyles.background}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  errorText: {
    fontSize: 18,
  },
  retryButton: {
    marginTop: 20,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
  },
  wishlistTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  wishlistDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginTop: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
  },
  itemImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  linkButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  linkText: {
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    borderRadius: 12,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: "-5deg" }],
  },
  badgeText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontStyle: "italic",
  },
});

/**
 * Creates dynamic styles based on the current theme.
 *
 * @param theme - The current theme colors.
 * @returns A style object with themed properties.
 */
function getThemedStyles(theme: (typeof Colors)["light" | "dark"]) {
  return StyleSheet.create({
    text: {
      color: theme.text,
    },
    textMuted: {
      color: theme.textMuted,
    },
    secondaryText: {
      color: theme.secondary,
    },
    primaryText: {
      color: theme.primary,
    },
    surfaceMuted: {
      backgroundColor: theme.surfaceMuted,
    },
    background: {
      backgroundColor: theme.background,
    },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.surfaceSubtle,
    },
    overlay: {
      backgroundColor: theme.overlay,
    },
    completedBadge: {
      borderColor: theme.text,
      backgroundColor: theme.card,
    },
    reservedBadge: {
      borderColor: theme.text,
      borderStyle: "dashed",
      backgroundColor: theme.card,
    },
    badgeText: {
      color: theme.text,
    },
    priorityHigh: {
      backgroundColor: theme.red100,
    },
    priorityMedium: {
      backgroundColor: theme.amber100,
    },
    priorityLow: {
      backgroundColor: theme.sky100,
    },
  });
}
