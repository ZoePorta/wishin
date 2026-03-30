import { useLocalSearchParams, Stack } from "expo-router";
import { useMemo, useCallback, useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Platform } from "react-native";
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
import { useUser } from "../../src/contexts/UserContext";
import { SpoilerOverlay } from "../../src/features/wishlist/components/SpoilerOverlay";
import { Layout } from "../../src/constants/Layout";
import { Avatar } from "../../src/components/common/Avatar";

/**
 * Display the details of a specific wishlist.
 * Uses Material Design 3 components.
 *
 * @returns {JSX.Element} The rendered wishlist details screen.
 */
export default function WishlistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { wishlist, loading, error, refetch }: UseWishlistReturn =
    useWishlist(id);
  const theme = useTheme();
  const { userId, isSessionReliable } = useUser();
  const [hasShownSuggestion, setHasShownSuggestion] = useState(false);
  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);

  const isOwner = useMemo(() => {
    // Return false while session resolution is indeterminate to prevent temporary owner UI exposure (ADR 027)
    if (!isSessionReliable) return false;
    return !!userId && !!wishlist && userId === wishlist.ownerId;
  }, [userId, wishlist, isSessionReliable]);

  // Reset spoiler revealed state when switching between wishlists (ADR 027 reinforcement)
  useEffect(() => {
    setIsSpoilerRevealed(false);
  }, [id]);

  const handleSuggestionShown = useCallback(() => {
    setHasShownSuggestion(true);
  }, []);

  const ListHeader = useMemo(() => {
    if (!wishlist) return null;
    return (
      <View style={styles.header}>
        <Text
          variant="headlineMedium"
          style={[styles.headerTitle, { color: theme.colors.onSurface }]}
        >
          {wishlist.title}
        </Text>
        <View style={styles.creatorContainer}>
          <Avatar
            uri={wishlist.ownerAvatarUrl}
            size={24}
            style={styles.creatorAvatar}
          />
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, fontWeight: "500" }}
          >
            {wishlist.ownerName ?? "Unknown"}
          </Text>
        </View>
        {wishlist.description && (
          <Text
            variant="bodyLarge"
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {wishlist.description}
          </Text>
        )}
        <Divider style={styles.divider} />
      </View>
    );
  }, [wishlist, theme]);

  const renderItem = useCallback(
    ({ item }: { item: WishlistItemOutput }) => (
      <PublicItemCard
        item={item}
        wishlistId={wishlist?.id ?? ""}
        hasShownSuggestion={hasShownSuggestion}
        onSuggestionShown={handleSuggestionShown}
        isOwner={isOwner}
        isSpoilerRevealed={isSpoilerRevealed}
      />
    ),
    [
      wishlist,
      hasShownSuggestion,
      handleSuggestionShown,
      isOwner,
      isSpoilerRevealed,
    ],
  );

  if (loading) {
    return (
      <Surface style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        <Button
          mode="contained"
          onPress={() => void refetch()}
          contentStyle={styles.buttonContent}
        >
          Tap to Retry
        </Button>
      </Surface>
    );
  }

  if (!wishlist) {
    return (
      <Surface style={styles.centerContainer}>
        <Text
          variant="bodyLarge"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Wishlist not found.
        </Text>
      </Surface>
    );
  }

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
        }}
      />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={wishlist.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text
              variant="bodyLarge"
              style={[
                styles.emptyText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              No items in this wishlist yet.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
      <SpoilerOverlay
        isVisible={isOwner && !isSpoilerRevealed}
        onReveal={() => {
          setIsSpoilerRevealed(true);
        }}
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
    padding: 24,
  },
  listContent: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    marginTop: Platform.OS === "web" ? Layout.headerHeightWeb : 0,
    marginBottom: 32,
  },
  headerTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  creatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  creatorAvatar: {
    marginRight: 8,
  },
  description: {
    lineHeight: 24,
    marginTop: 8,
  },
  divider: {
    marginTop: 24,
  },
  errorText: {
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "600",
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: "center",
  },
  emptyText: {
    fontStyle: "italic",
    textAlign: "center",
  },
  buttonContent: {
    height: 48,
    paddingHorizontal: 16,
  },
});
