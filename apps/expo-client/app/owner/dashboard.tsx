import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import {
  Portal,
  Modal,
  FAB,
  IconButton,
  Text as PaperText,
  ActivityIndicator,
  Button,
} from "react-native-paper";
import { type WishlistItemOutput } from "@wishin/domain";
import { useOwnerDashboard } from "../../src/features/wishlist/hooks/useOwnerDashboard";
import { useWishlistStyles } from "../../src/features/wishlist/hooks/useWishlistStyles";
import { WishlistForm } from "../../src/features/wishlist/components/WishlistForm";
import { AddItemForm } from "../../src/features/wishlist/components/AddItemForm";
import { DashboardHeader } from "../../src/features/wishlist/components/DashboardHeader";
import { DashboardContent } from "../../src/features/wishlist/components/DashboardContent";
import { createDashboardStyles } from "../../src/features/wishlist/styles/dashboard.styles";
import { Spacing } from "../../src/theme/spacing";

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
  const [updating, setUpdating] = useState(false);
  const [editingItem, setEditingItem] = useState<
    WishlistItemOutput | undefined
  >();

  const dashboardStyles = useMemo(() => createDashboardStyles(theme), [theme]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, themedStyles.background]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, themedStyles.background]}>
        <PaperText
          variant="bodyLarge"
          style={[styles.errorText, themedStyles.text]}
        >
          {error}
        </PaperText>
        <Button
          mode="contained"
          onPress={() => void refetch()}
          style={styles.retryButton}
          labelStyle={themedStyles.primaryText}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <Portal.Host>
      <View style={[dashboardStyles.container, themedStyles.background]}>
        <Stack.Screen options={{ title: "My Dashboard" }} />

        {!wishlist ? (
          <View style={{ flex: 1 }}>
            <PaperText
              variant="titleLarge"
              style={dashboardStyles.sectionTitle}
            >
              Create Your Wishlist
            </PaperText>
            <WishlistForm
              onSubmit={async (data) => {
                await handleCreate(data);
              }}
              loading={creating}
              currentUserId={userId ?? ""}
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <DashboardHeader
              wishlist={wishlist}
              commonStyles={styles}
              onEdit={() => {
                setIsEditing(true);
              }}
            />

            <DashboardContent
              wishlist={wishlist}
              styles={styles}
              dashboardStyles={dashboardStyles}
              onRemoveItem={handleRemoveItem}
              onEditItem={(item) => {
                setEditingItem(item);
                setIsItemModalVisible(true);
              }}
            />

            <FAB
              icon="plus"
              label={wishlist.items.length === 0 ? "Add Item" : ""}
              onPress={() => {
                setEditingItem(undefined);
                setIsItemModalVisible(true);
              }}
              style={dashboardStyles.fabPosition}
              accessibilityLabel="Add item to wishlist"
            />

            <Portal>
              <Modal
                visible={isItemModalVisible}
                onDismiss={() => {
                  setIsItemModalVisible(false);
                  setEditingItem(undefined);
                }}
                contentContainerStyle={[
                  themedStyles.background,
                  dashboardStyles.modalContent,
                  {
                    maxHeight: "80%",
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: Spacing.lg,
                  }}
                >
                  <PaperText variant="headlineSmall" accessibilityRole="header">
                    {editingItem ? "Edit Item" : "Add Item"}
                  </PaperText>
                  <IconButton
                    icon="close"
                    onPress={() => {
                      setIsItemModalVisible(false);
                      setEditingItem(undefined);
                    }}
                  />
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
              </Modal>
            </Portal>

            <Portal>
              <Modal
                visible={isEditing}
                onDismiss={() => {
                  setIsEditing(false);
                }}
                contentContainerStyle={[
                  themedStyles.background,
                  dashboardStyles.modalContent,
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: Spacing.lg,
                  }}
                >
                  <PaperText variant="headlineSmall" accessibilityRole="header">
                    Edit Wishlist
                  </PaperText>
                  <IconButton
                    icon="close"
                    onPress={() => {
                      setIsEditing(false);
                    }}
                  />
                </View>
                <WishlistForm
                  initialData={wishlist}
                  onSubmit={async (data) => {
                    if (data.id) {
                      setUpdating(true);
                      try {
                        const result = await handleUpdate(
                          data as Required<Pick<typeof data, "id">> &
                            typeof data,
                        );
                        if (result) {
                          setIsEditing(false);
                        }
                      } finally {
                        setUpdating(false);
                      }
                    }
                  }}
                  loading={updating}
                  currentUserId={userId ?? ""}
                />
              </Modal>
            </Portal>
          </View>
        )}
      </View>
    </Portal.Host>
  );
}
