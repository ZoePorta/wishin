import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import {
  Portal,
  Modal,
  FAB,
  IconButton,
  Text as PaperText,
  ActivityIndicator,
  Button,
  useTheme,
  Surface,
} from "react-native-paper";
import { type WishlistItemOutput } from "@wishin/domain";
import { commonStyles } from "../../src/theme/common-styles";
import { useOwnerDashboard } from "../../src/features/wishlist/hooks/useOwnerDashboard";
import { useUser } from "../../src/contexts/UserContext";
import { WishlistForm } from "../../src/features/wishlist/components/WishlistForm";
import { AddItemForm } from "../../src/features/wishlist/components/AddItemForm";
import { DashboardHeader } from "../../src/features/wishlist/components/DashboardHeader";
import { DashboardContent } from "../../src/features/wishlist/components/DashboardContent";

/**
 * Dashboard screen for wishlist owners.
 * Orchestrates the creation and management of wishlists.
 *
 * @returns {JSX.Element} The rendered owner dashboard screen.
 */
export default function OwnerDashboard() {
  const theme = useTheme();
  const { sessionType } = useUser();
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

  // Route-level guard: only registered owners can access this dashboard
  React.useEffect(() => {
    if (!loading && sessionType !== null && sessionType !== "registered") {
      router.replace("/");
    }
  }, [sessionType, loading]);

  if (loading || (sessionType !== null && sessionType !== "registered")) {
    return (
      <Surface style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface style={styles.centerContainer}>
        <PaperText
          variant="bodyLarge"
          style={[styles.errorText, { color: theme.colors.error }]}
        >
          {error}
        </PaperText>
        <Button
          mode="contained"
          onPress={() => void refetch()}
          contentStyle={commonStyles.minimumTouchTarget}
        >
          Retry
        </Button>
      </Surface>
    );
  }

  return (
    <Portal.Host>
      <Surface
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Stack.Screen
          options={{
            title: "My Dashboard",
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
          }}
        />

        {!wishlist ? (
          <View style={styles.formContainer}>
            <PaperText
              variant="headlineSmall"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
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
          <View style={styles.mainContent}>
            <DashboardHeader
              wishlist={wishlist}
              onEdit={() => {
                setIsEditing(true);
              }}
            />

            <DashboardContent
              wishlist={wishlist}
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
              style={[
                styles.fab,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
              color={theme.colors.onPrimaryContainer}
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
                  styles.modalContent,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View style={styles.modalHeader}>
                  <PaperText
                    variant="headlineSmall"
                    accessibilityRole="header"
                    style={{ color: theme.colors.onSurface }}
                  >
                    {editingItem ? "Edit Item" : "Add Item"}
                  </PaperText>
                  <IconButton
                    icon="close"
                    onPress={() => {
                      setIsItemModalVisible(false);
                      setEditingItem(undefined);
                    }}
                    accessibilityLabel="Close item modal"
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
                  styles.modalContent,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View style={styles.modalHeader}>
                  <PaperText
                    variant="headlineSmall"
                    accessibilityRole="header"
                    style={{ color: theme.colors.onSurface }}
                  >
                    Edit Wishlist
                  </PaperText>
                  <IconButton
                    icon="close"
                    onPress={() => {
                      setIsEditing(false);
                    }}
                    accessibilityLabel="Close edit wishlist modal"
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
      </Surface>
    </Portal.Host>
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
  errorText: {
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  formContainer: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    marginBottom: 24,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  modalContent: {
    margin: 20,
    padding: 24,
    borderRadius: 28,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  mainContent: {
    flex: 1,
  },
});
