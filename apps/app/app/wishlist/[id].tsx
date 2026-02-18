import { useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useState, useMemo, useCallback } from "react";
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
} from "react-native";
import { Colors } from "../../src/constants/Colors";
import { MockWishlistService } from "../../src/services/MockWishlistService";
import type {
  Wishlist,
  WishlistItem,
} from "../../src/services/MockWishlistService";

/**
 * Display the details of a specific wishlist.
 *
 * @returns The WishlistDetail component.
 */
export default function WishlistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MockWishlistService.getWishlistById(id);
      setWishlist(data);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      void loadWishlist();
    } else {
      setLoading(false);
    }
  }, [id, loadWishlist]);

  const ListHeader = useMemo(() => {
    if (!wishlist) return null;
    return (
      <View style={styles.header}>
        <Text style={[styles.wishlistTitle, { color: theme.text }]}>
          {wishlist.title}
        </Text>
        {wishlist.description && (
          <Text
            style={[styles.wishlistDescription, { color: theme.textMuted }]}
          >
            {wishlist.description}
          </Text>
        )}
        <View
          style={[styles.divider, { backgroundColor: theme.surfaceMuted }]}
        />
      </View>
    );
  }, [wishlist, theme]);

  // Hoisted renderItem
  const renderItem = useCallback(
    ({ item }: { item: WishlistItem }) => (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.surfaceSubtle,
          },
        ]}
      >
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        )}

        {/* Reserved Overlay moved here to cover image + content */}
        {item.isReserved && (
          <View
            style={[
              styles.reservedOverlay,
              {
                backgroundColor: theme.overlay,
              },
            ]}
          >
            <Text
              style={[
                styles.reservedText,
                { color: theme.text, borderColor: theme.text },
              ]}
            >
              RESERVED
            </Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.itemTitle, { color: theme.text }]}>
              {item.title}
            </Text>
            {item.price != null && (
              <Text style={[styles.itemPrice, { color: theme.primary }]}>
                {item.currency} {item.price.toFixed(2)}
              </Text>
            )}
          </View>

          {item.description && (
            <Text
              style={[styles.itemDescription, { color: theme.textMuted }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor:
                    item.priority === "high"
                      ? theme.red100
                      : item.priority === "medium"
                        ? theme.amber100
                        : theme.sky100,
                },
              ]}
            >
              <Text style={[styles.priorityText, { color: theme.text }]}>
                {item.priority.toUpperCase()}
              </Text>
            </View>

            {item.url && (
              <Pressable
                style={({ pressed }) => [
                  styles.linkButton,
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                onPress={() => item.url && void Linking.openURL(item.url)}
                accessibilityLabel={`View Online, ${item.title}`}
                accessibilityRole="link"
              >
                <Text style={[styles.linkText, { color: theme.secondary }]}>
                  View Online
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    ),
    [theme],
  );

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.errorText, { color: theme.textMuted }]}>
          {error}
        </Text>
        <Pressable
          onPress={() => void loadWishlist()}
          style={{ marginTop: 20 }}
        >
          <Text
            style={{ color: theme.primary, fontSize: 16, fontWeight: "600" }}
          >
            Tap to Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!wishlist) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.errorText, { color: theme.textMuted }]}>
          Wishlist not found.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: wishlist.title }} />
      <FlatList
        contentContainerStyle={[
          styles.listContent,
          { backgroundColor: theme.background },
        ]}
        data={wishlist.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        style={{ backgroundColor: theme.background }}
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
  errorText: {
    fontSize: 18,
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
    overflow: "hidden",
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
  reservedOverlay: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor handled dynamically
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  reservedText: {
    fontWeight: "bold",
    fontSize: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    transform: [{ rotate: "-5deg" }],
  },
});
