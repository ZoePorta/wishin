import { useLocalSearchParams, Stack } from "expo-router";
import { useMemo, useCallback } from "react";
import { View, FlatList } from "react-native";
import { Text, ActivityIndicator, Button, useTheme } from "react-native-paper";
import { useWishlist } from "../../src/hooks/useWishlist";
import type { UseWishlistReturn } from "../../src/hooks/useWishlist";
import type { WishlistItemOutput } from "@wishin/domain";
import { useWishlistStyles } from "../../src/features/wishlist/hooks/useWishlistStyles";
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
  const { styles, themedStyles } = useWishlistStyles();

  const ListHeader = useMemo(() => {
    if (!wishlist) return null;
    return (
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ marginBottom: 8 }}>
          {wishlist.title}
        </Text>
        {wishlist.description && (
          <Text variant="bodyMedium">{wishlist.description}</Text>
        )}
        <View
          style={[
            styles.divider,
            { backgroundColor: theme.colors.outlineVariant, marginTop: 16 },
          ]}
        />
      </View>
    );
  }, [wishlist, styles, theme]);

  const renderItem = useCallback(
    ({ item }: { item: WishlistItemOutput }) => (
      <PublicItemCard item={item} styles={styles} themedStyles={themedStyles} />
    ),
    [styles, themedStyles],
  );

  if (loading) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text
          variant="bodyLarge"
          style={{ color: theme.colors.error, marginBottom: 20 }}
        >
          {error}
        </Text>
        <Button
          mode="contained"
          onPress={() => {
            void refetch();
          }}
        >
          Tap to Retry
        </Button>
      </View>
    );
  }

  if (!wishlist) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text variant="bodyLarge">Wishlist not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: wishlist.title }} />
      <FlatList
        contentContainerStyle={[
          styles.listContent,
          { backgroundColor: theme.colors.background },
        ]}
        data={wishlist.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyMedium" style={{ fontStyle: "italic" }}>
              No items in this wishlist.
            </Text>
          </View>
        }
        style={{ backgroundColor: theme.colors.background }}
      />
    </>
  );
}
