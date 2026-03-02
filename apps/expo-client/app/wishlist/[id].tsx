import { useLocalSearchParams, Stack } from "expo-router";
import { useMemo, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useWishlist } from "../../src/hooks/useWishlist";
import type { UseWishlistReturn } from "../../src/hooks/useWishlist";
import type { WishlistItemOutput } from "@wishin/domain";
import { useWishlistStyles } from "../../src/features/wishlist/hooks/useWishlistStyles";
import { PublicItemCard } from "../../src/features/wishlist/components/PublicItemCard";

/**
 * Display the details of a specific wishlist.
 *
 * @returns The WishlistDetail component.
 */
export default function WishlistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { wishlist, loading, error, refetch }: UseWishlistReturn =
    useWishlist(id);
  const { theme, styles, themedStyles } = useWishlistStyles();

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
  }, [wishlist, styles, themedStyles]);

  // Hoisted renderItem
  const renderItem = useCallback(
    ({ item }: { item: WishlistItemOutput }) => (
      <PublicItemCard item={item} styles={styles} themedStyles={themedStyles} />
    ),
    [styles, themedStyles],
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
