import React, { useMemo, useState } from "react";
import { View, Text, ActivityIndicator, Pressable, Modal } from "react-native";
import { Stack } from "expo-router";
import { type WishlistItemOutput } from "@wishin/domain";
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
    handleUpdate,
    handleAddItem,
    handleUpdateItem,
    handleRemoveItem,
    refetch,
  } = useOwnerDashboard();

  const [isEditing, setIsEditing] = useState(false);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<
    WishlistItemOutput | undefined
  >();

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
            onEdit={() => {
              setIsEditing(true);
            }}
          />

          <DashboardContent
            wishlist={wishlist}
            styles={styles}
            themedStyles={themedStyles}
            dashboardStyles={dashboardStyles}
            onRemoveItem={handleRemoveItem}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsItemModalVisible(true);
            }}
          />

          {/* Floating Action Button (FAB) for adding items */}
          <Pressable
            style={({ pressed }) => [
              {
                position: "absolute",
                bottom: 24,
                right: 24,
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: theme.primary,
                justifyContent: "center",
                alignItems: "center",
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => {
              setEditingItem(undefined);
              setIsItemModalVisible(true);
            }}
          >
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
              +
            </Text>
          </Pressable>

          {/* Item Add/Edit Modal */}
          <Modal
            visible={isItemModalVisible}
            animationType="slide"
            onRequestClose={() => {
              setIsItemModalVisible(false);
              setEditingItem(undefined);
            }}
          >
            <View
              style={[
                themedStyles.background,
                { flex: 1, padding: 20, paddingTop: 60 },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: themedStyles.text.color,
                  }}
                >
                  {editingItem ? "Edit Item" : "Add Item"}
                </Text>
                <Pressable
                  onPress={() => {
                    setIsItemModalVisible(false);
                    setEditingItem(undefined);
                  }}
                >
                  <Text style={{ color: theme.primary, fontWeight: "600" }}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
              <AddItemForm
                wishlistId={wishlist.id}
                initialData={editingItem}
                onSubmit={async (data) => {
                  if (editingItem) {
                    const { wishlistId: _, ...rest } = data;
                    await handleUpdateItem({
                      wishlistId: wishlist.id,
                      itemId: editingItem.id,
                      ...rest,
                    });
                  } else {
                    await handleAddItem(data);
                  }
                  setIsItemModalVisible(false);
                  setEditingItem(undefined);
                }}
                loading={itemActionLoading}
              />
            </View>
          </Modal>

          <Modal
            visible={isEditing}
            animationType="slide"
            onRequestClose={() => {
              setIsEditing(false);
            }}
          >
            <View
              style={[
                themedStyles.background,
                { flex: 1, padding: 20, paddingTop: 60 },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: themedStyles.text.color,
                  }}
                >
                  Edit Wishlist
                </Text>
                <Pressable
                  onPress={() => {
                    setIsEditing(false);
                  }}
                >
                  <Text style={{ color: theme.primary, fontWeight: "600" }}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
              <WishlistForm
                initialData={wishlist}
                onSubmit={async (data) => {
                  const result = await handleUpdate(data);
                  if (result) {
                    setIsEditing(false);
                  }
                }}
                loading={creating}
                currentUserId={userId ?? ""}
              />
            </View>
          </Modal>
        </View>
      )}
    </View>
  );
}
