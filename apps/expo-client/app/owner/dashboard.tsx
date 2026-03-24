import React, { useState } from "react";
import { View, StyleSheet, Alert, Platform } from "react-native";
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
  Snackbar,
} from "react-native-paper";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { type WishlistItemOutput } from "@wishin/domain";
import { Config } from "../../src/constants/Config";
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
  const [isShareSnackbarVisible, setIsShareSnackbarVisible] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const handleShare = async () => {
    if (!wishlist) return;

    try {
      const url = Config.baseUrl
        ? `${Config.baseUrl}/wishlist/${wishlist.id}`
        : Linking.createURL(`wishlist/${wishlist.id}`);

      await Clipboard.setStringAsync(url);
      setIsShareSnackbarVisible(true);
    } catch (err) {
      console.error("Failed to share wishlist:", err);
      Alert.alert(
        "Share Failed",
        "Could not copy the wishlist link to your clipboard. Please try again.",
      );
    }
  };

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
            <DashboardHeader wishlist={wishlist} />

            <DashboardContent
              wishlist={wishlist}
              onRemoveItem={handleRemoveItem}
              onEditItem={(item) => {
                setEditingItem(item);
                setIsItemModalVisible(true);
              }}
            />

            <Portal>
              {Platform.OS === "web" ? (
                <View style={styles.webFabContainer}>
                  {fabOpen && (
                    <View style={styles.webFabActions}>
                      <FAB
                        icon="plus"
                        label="Add Item"
                        onPress={() => {
                          setEditingItem(undefined);
                          setIsItemModalVisible(true);
                          setFabOpen(false);
                        }}
                        style={styles.webFabAction}
                        size="small"
                      />
                      <FAB
                        icon="share-variant"
                        label="Share Wishlist"
                        onPress={() => {
                          void handleShare();
                          setFabOpen(false);
                        }}
                        style={styles.webFabAction}
                        size="small"
                      />
                      <FAB
                        icon="pencil"
                        label="Edit Wishlist"
                        onPress={() => {
                          setIsEditing(true);
                          setFabOpen(false);
                        }}
                        style={styles.webFabAction}
                        size="small"
                      />
                    </View>
                  )}
                  <FAB
                    icon={fabOpen ? "close" : "dots-vertical"}
                    onPress={() => {
                      setFabOpen(!fabOpen);
                    }}
                    style={styles.fabMain}
                    accessibilityLabel="Wishlist actions"
                  />
                </View>
              ) : (
                <FAB.Group
                  open={fabOpen}
                  visible
                  icon={fabOpen ? "close" : "dots-vertical"}
                  actions={[
                    {
                      icon: "plus",
                      label: "Add Item",
                      onPress: () => {
                        setEditingItem(undefined);
                        setIsItemModalVisible(true);
                      },
                    },
                    {
                      icon: "share-variant",
                      label: "Share Wishlist",
                      onPress: () => {
                        void handleShare();
                      },
                    },
                    {
                      icon: "pencil",
                      label: "Edit Wishlist",
                      onPress: () => {
                        setIsEditing(true);
                      },
                    },
                  ]}
                  onStateChange={({ open }) => {
                    setFabOpen(open);
                  }}
                  accessibilityLabel="Wishlist actions"
                />
              )}
            </Portal>

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

            <Snackbar
              visible={isShareSnackbarVisible}
              onDismiss={() => {
                setIsShareSnackbarVisible(false);
              }}
              duration={3000}
              action={{
                label: "OK",
                onPress: () => {
                  setIsShareSnackbarVisible(false);
                },
              }}
            >
              Link copied to clipboard
            </Snackbar>
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

  modalContent: {
    margin: 20,
    padding: 24,
    borderRadius: 28,
    maxHeight: "85%",
    flex: 1, // Added for Android visibility
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
  webFabContainer: {
    position: "absolute",
    right: 0,
    bottom: 0,
    padding: 16,
    alignItems: "flex-end",
  },
  webFabActions: {
    marginBottom: 16,
    alignItems: "flex-end",
  },
  webFabAction: {
    marginBottom: 16,
  },
  fabMain: {
    // Standard FAB positioning
  },
});
