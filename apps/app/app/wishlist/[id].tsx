import { useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  Linking,
  Pressable,
} from "react-native";
import { Colors } from "../../src/constants/Colors";
import {
  MockWishlistService,
  Wishlist,
  WishlistItem,
} from "../../src/services/MockWishlistService";

export default function WishlistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      void loadWishlist(id);
    }
  }, [id]);

  const loadWishlist = async (wishlistId: string) => {
    try {
      setLoading(true);
      const data = await MockWishlistService.getWishlistById(wishlistId);
      setWishlist(data);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!wishlist) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Wishlist not found.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <View style={styles.card}>
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {item.price && (
            <Text style={styles.itemPrice}>
              {item.currency} {item.price.toFixed(2)}
            </Text>
          )}
        </View>

        {item.description && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View
            style={[
              styles.priorityBadge,
              item.priority === "high"
                ? styles.priorityHigh
                : item.priority === "medium"
                  ? styles.priorityMedium
                  : styles.priorityLow,
            ]}
          >
            <Text style={styles.priorityText}>
              {item.priority.toUpperCase()}
            </Text>
          </View>

          {item.url && (
            <Pressable
              onPress={() => item.url && void Linking.openURL(item.url)}
            >
              <Text style={styles.linkText}>View Online</Text>
            </Pressable>
          )}
        </View>

        {item.isReserved && (
          <View style={styles.reservedOverlay}>
            <Text style={styles.reservedText}>RESERVED</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: wishlist.title }} />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={wishlist.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.wishlistTitle}>{wishlist.title}</Text>
            {wishlist.description && (
              <Text style={styles.wishlistDescription}>
                {wishlist.description}
              </Text>
            )}
            <View style={styles.divider} />
          </View>
        )}
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
    color: Colors.light.textMuted,
  },
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  wishlistTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  wishlistDescription: {
    fontSize: 16,
    color: Colors.light.textMuted,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0", // Slate 200 equivalent
    marginTop: 16,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9", // Slate 100
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
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  itemDescription: {
    fontSize: 14,
    color: Colors.light.textMuted,
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
  priorityHigh: { backgroundColor: "#FEE2E2" }, // Red 100
  priorityMedium: { backgroundColor: "#FEF3C7" }, // Amber 100
  priorityLow: { backgroundColor: "#E0F2FE" }, // Sky 100
  priorityText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  linkText: {
    color: Colors.light.secondary,
    fontWeight: "600",
  },
  reservedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  reservedText: {
    color: Colors.light.text,
    fontWeight: "bold",
    fontSize: 16,
    borderWidth: 2,
    borderColor: Colors.light.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    transform: [{ rotate: "-5deg" }],
  },
});
