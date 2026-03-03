import { useLocalSearchParams, Stack } from "expo-router";
import { useMemo, useCallback } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import {
  Text,
  ActivityIndicator,
  Button,
  useTheme,
  Divider,
  Surface,
} from "react-native-paper";
import { useWishlist } from "../../src/hooks/useWishlist";
import type { UseWishlistReturn } from "../../src/hooks/useWishlist";
import type { WishlistItemOutput } from "@wishin/domain";
import { PublicItemCard } from "../../src/features/wishlist/components/PublicItemCard";

/**
 * Display the details of a specific wishlist.
 * Uses Material Design 3 components.
 */
export default function WishlistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { wishlist, loading, error, refetch }: UseWishlistReturn =
    useWishlist(id);
  const theme = useTheme();

  const ListHeader = useMemo(() => {
    if (!wishlist) return null;
    return (
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          {wishlist.title}
        </Text>
        {wishlist.description && (
          <Text variant="bodyMedium" style={styles.description}>
            {wishlist.description}
          </Text>
        )}
        <Divider style={styles.divider} />
      </View>
    );
  }, [wishlist]);

  const renderItem = useCallback(
    ({ item }: { item: WishlistItemOutput }) => <PublicItemCard item={item} />,
    [],
  );

  if (loading) {
    return (
      <Surface style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface style={styles.centerContainer}>
        <Text
          variant="bodyLarge"
          style={[styles.errorText, { color: theme.colors.error }]}
        >
          {error}
        </Text>
        <Button mode="contained" onPress={() => void refetch()}>
          Tap to Retry
        </Button>
      </Surface>
    );
  }

  if (!wishlist) {
    return (
      <Surface style={styles.centerContainer}>
        <Text variant="bodyLarge">Wishlist not found.</Text>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container}>
      <Stack.Screen options={{ title: wishlist.title }} />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={wishlist.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No items in this wishlist.
            </Text>
          </View>
        }
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    marginBottom: 4,
  },
  description: {
    opacity: 0.7,
  },
  divider: {
    marginTop: 16,
  },
  errorText: {
    marginBottom: 20,
    textAlign: "center",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontStyle: "italic",
    opacity: 0.5,
  },
});
