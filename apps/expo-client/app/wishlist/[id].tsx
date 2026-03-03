import { useLocalSearchParams, Stack } from "expo-router";
import { useMemo, useCallback } from "react";
import { View, FlatList, StyleSheet } from "react-native";
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
  const { styles } = useWishlistStyles();
  const localStyles = useMemo(() => {
    return StyleSheet.create({
      headerTitle: {
        marginBottom: 8,
      },
      dividerVariant: {
        backgroundColor: theme.colors.outlineVariant,
        marginTop: 16,
      },
      screenBackground: {
        backgroundColor: theme.colors.background,
      },
      errorTextContainer: {
        color: theme.colors.error,
        marginBottom: 20,
      },
      emptyText: {
        fontStyle: "italic",
      },
    });
  }, [theme]);

  const ListHeader = useMemo(() => {
    if (!wishlist) return null;
    return (
      <View style={styles.header}>
        <Text variant="headlineMedium" style={localStyles.headerTitle}>
          {wishlist.title}
        </Text>
        {wishlist.description && (
          <Text variant="bodyMedium">{wishlist.description}</Text>
        )}
        <View style={[styles.divider, localStyles.dividerVariant]} />
      </View>
    );
  }, [wishlist, styles, theme]);

  const renderItem = useCallback(
    ({ item }: { item: WishlistItemOutput }) => (
      <PublicItemCard item={item} styles={styles} />
    ),
    [styles],
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, localStyles.screenBackground]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, localStyles.screenBackground]}>
        <Text variant="bodyLarge" style={localStyles.errorTextContainer}>
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
      <View style={[styles.centerContainer, localStyles.screenBackground]}>
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
          localStyles.screenBackground,
        ]}
        data={wishlist.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyMedium" style={localStyles.emptyText}>
              No items in this wishlist.
            </Text>
          </View>
        }
        style={localStyles.screenBackground}
      />
    </>
  );
}
