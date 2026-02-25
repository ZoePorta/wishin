import React, { useMemo } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { Stack } from "expo-router";
import { useOwnerDashboard } from "../../src/features/wishlist/hooks/useOwnerDashboard";
import { useWishlistStyles } from "../../src/features/wishlist/hooks/useWishlistStyles";
import { WishlistForm } from "../../src/features/wishlist/components/WishlistForm";
import { AddItemForm } from "../../src/features/wishlist/components/AddItemForm";
import { DashboardHeader } from "../../src/features/wishlist/components/DashboardHeader";
import { DashboardContent } from "../../src/features/wishlist/components/DashboardContent";
import { createDashboardStyles } from "../../src/features/wishlist/styles/dashboard.styles";

/**
 * Dashboard screen for wishlist owners.
 * Orchestrates the creation and management of wishlists using a decoupled View Model approach.
 */
export default function OwnerDashboard() {
  const { theme, styles, themedStyles } = useWishlistStyles();
  const {
    userId,
    wishlist,
    loading,
    error,
    creating,
    itemActionLoading,
    handleCreate,
    handleAddItem,
    handleRemoveItem,
    refetch,
  } = useOwnerDashboard();

  const dashboardStyles = useMemo(() => createDashboardStyles(theme), [theme]);

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
        <Text style={[styles.errorText, themedStyles.text]}>{error}</Text>
        <Pressable onPress={() => void refetch()} style={styles.retryButton}>
          <Text style={[styles.retryText, themedStyles.primaryText]}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[dashboardStyles.container, themedStyles.background]}>
      <Stack.Screen options={{ title: "My Dashboard" }} />

      {!wishlist ? (
        <View style={{ flex: 1 }}>
          <Text style={dashboardStyles.sectionTitle}>Create Your Wishlist</Text>
          <WishlistForm
            onSubmit={handleCreate}
            loading={creating}
            currentUserId={userId ?? ""}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <DashboardHeader
            wishlist={wishlist}
            styles={styles}
            themedStyles={themedStyles}
          />

          <DashboardContent
            wishlist={wishlist}
            styles={styles}
            themedStyles={themedStyles}
            dashboardStyles={dashboardStyles}
            onRemoveItem={handleRemoveItem}
            renderAddItemForm={() => (
              <AddItemForm
                wishlistId={wishlist.id}
                onSubmit={handleAddItem}
                loading={itemActionLoading}
              />
            )}
          />
        </View>
      )}
    </View>
  );
}
