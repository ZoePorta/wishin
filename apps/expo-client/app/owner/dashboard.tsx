import React, { useState } from "react";
import { View, StyleSheet, Alert, Platform, Pressable } from "react-native";
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
  Dialog,
  TextInput,
  HelperText,
} from "react-native-paper";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { type WishlistItemOutput } from "@wishin/domain";
import { Config } from "../../src/constants/Config";
import { commonStyles } from "../../src/theme/common-styles";
import { useOwnerDashboard } from "../../src/features/wishlist/hooks/useOwnerDashboard";
import { useUser } from "../../src/contexts/UserContext";
import { useRepositories } from "../../src/contexts/WishlistRepositoryContext";
import { useProfile } from "../../src/features/profile/hooks/useProfile";
import { WishlistForm } from "../../src/features/wishlist/components/WishlistForm";
import { AddItemForm } from "../../src/features/wishlist/components/AddItemForm";
import { DashboardHeader } from "../../src/features/wishlist/components/DashboardHeader";
import { DashboardContent } from "../../src/features/wishlist/components/DashboardContent";
import { ItemDetailModal } from "../../src/features/wishlist/components/ItemDetailModal";
import { useImagePickerAndUpload } from "../../src/hooks/useImagePickerAndUpload";
import { useUpdateProfile } from "../../src/features/profile/hooks/useUpdateProfile";
import { GetProfileByIdUseCase } from "@wishin/domain";

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
    loading: wishlistLoading,
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

  const {
    profile,
    loading: profileLoading,
    refetch: refetchProfile,
    error: profileError,
  } = useProfile(userId ?? undefined);
  const { updateProfile, updating: profileUpdating } = useUpdateProfile();
  const { pickAndUpload, uploading: imageUploading } =
    useImagePickerAndUpload();
  const { storageRepository, profileRepository } = useRepositories();
  const [localAvatarUpdating, setLocalAvatarUpdating] = useState(false);

  const handleEditAvatar = async () => {
    if (!userId) return;
    setLocalAvatarUpdating(true);
    try {
      const newImageUrl = await pickAndUpload();
      if (!newImageUrl) return;

      try {
        await updateProfile({ id: userId, imageUrl: newImageUrl });
      } catch (err) {
        console.error("Failed to update profile picture mutation:", err);
      }

      // Verification stage: refetch from source of truth and only cleanup if not set
      try {
        const getProfileUseCase = new GetProfileByIdUseCase(profileRepository);
        const latestProfile = await getProfileUseCase.execute({ id: userId });

        if (latestProfile.imageUrl !== newImageUrl) {
          const fileId = storageRepository.extractFileId(newImageUrl);
          if (fileId) {
            await storageRepository
              .delete(fileId)
              .catch((deleteErr: unknown) => {
                console.error("Failed to clean up orphaned avatar:", deleteErr);
              });
          }
        }
      } catch (verifyErr) {
        console.error("Verification of profile update failed:", verifyErr);
      }

      await refetchProfile();
    } finally {
      setLocalAvatarUpdating(false);
    }
  };

  const isAvatarUpdating = imageUploading || localAvatarUpdating;
  const isUsernameSaving = profileUpdating;
  const screenError = error ?? profileError;
  const loading = wishlistLoading || profileLoading;

  const [isEditing, setIsEditing] = useState(false);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingItem, setEditingItem] = useState<
    WishlistItemOutput | undefined
  >();
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isShareSnackbarVisible, setIsShareSnackbarVisible] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [isUsernameDialogVisible, setIsUsernameDialogVisible] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const handleEditUsername = () => {
    if (!profile) return;
    setNewUsername(profile.username);
    setIsUsernameDialogVisible(true);
  };

  const handleUpdateUsername = async () => {
    if (!userId || !newUsername.trim()) {
      setUsernameError("Please enter a username so we know who you are! 😊");
      return;
    }
    try {
      await updateProfile({ id: userId, username: newUsername.trim() });
      setIsUsernameDialogVisible(false);
      setUsernameError(null);
      await refetchProfile();
    } catch (err) {
      console.error("Failed to update username:", err);
      const errorMessage = err instanceof Error ? err.message : "";

      if (errorMessage.includes("non-empty")) {
        setUsernameError("Please enter a username so we know who you are! 😊");
      } else if (errorMessage.includes("length")) {
        setUsernameError(
          "Your username should be between 3 and 30 characters. Keep it short and sweet! ✨",
        );
      } else if (errorMessage.includes("format")) {
        setUsernameError(
          "Only letters, numbers, spaces, and .-_ are allowed. Let's keep it simple! 🖋️",
        );
      } else {
        setUsernameError(
          "Oops! We couldn't update your username. Please try again. 🛠️",
        );
      }
    }
  };

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

  if (screenError) {
    return (
      <Surface style={styles.centerContainer}>
        <PaperText
          variant="bodyLarge"
          style={[styles.errorText, { color: theme.colors.error }]}
        >
          {screenError}
        </PaperText>
        <Button
          mode="contained"
          onPress={() => {
            void refetch();
            void refetchProfile();
          }}
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
            <DashboardContent
              wishlist={wishlist}
              onRemoveItem={handleRemoveItem}
              onEditItem={(item) => {
                setEditingItem(item);
                setIsItemModalVisible(true);
              }}
              onItemPress={(item) => {
                setEditingItem(item);
                setIsDetailModalVisible(true);
              }}
              ListHeaderComponent={
                <DashboardHeader
                  wishlist={wishlist}
                  profile={profile}
                  onEditAvatar={() => {
                    void handleEditAvatar();
                  }}
                  onEditUsername={handleEditUsername}
                  isUpdating={isAvatarUpdating}
                />
              }
            />

            <Portal>
              {Platform.OS === "web" ? (
                <View style={styles.webFabContainer}>
                  {fabOpen && (
                    <>
                      <Pressable
                        style={[
                          StyleSheet.absoluteFill,
                          {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
                            position: "fixed" as any,
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "transparent",
                          },
                        ]}
                        onPress={() => {
                          setFabOpen(false);
                        }}
                      />
                      <View style={styles.webFabActions}>
                        <FAB
                          icon="plus"
                          label="Add Item"
                          onPress={() => {
                            setEditingItem(undefined);
                            setIsItemModalVisible(true);
                            setFabOpen(false);
                          }}
                          style={[
                            styles.webFabAction,
                            { backgroundColor: theme.colors.primary },
                          ]}
                          color={theme.colors.onPrimary}
                        />
                        <FAB
                          icon="share-variant"
                          label="Share Wishlist"
                          onPress={() => {
                            void handleShare();
                            setFabOpen(false);
                          }}
                          style={[
                            styles.webFabAction,
                            { backgroundColor: theme.colors.primary },
                          ]}
                          color={theme.colors.onPrimary}
                        />
                        <FAB
                          icon="pencil"
                          label="Edit Wishlist"
                          onPress={() => {
                            setIsEditing(true);
                            setFabOpen(false);
                          }}
                          style={[
                            styles.webFabAction,
                            { backgroundColor: theme.colors.primary },
                          ]}
                          color={theme.colors.onPrimary}
                        />
                      </View>
                    </>
                  )}
                  <FAB
                    icon={fabOpen ? "close" : "dots-vertical"}
                    onPress={() => {
                      setFabOpen(!fabOpen);
                    }}
                    accessibilityLabel="Wishlist actions"
                    style={{ backgroundColor: theme.colors.primary }}
                    color={theme.colors.onPrimary}
                  />
                </View>
              ) : (
                <FAB.Group
                  open={fabOpen}
                  visible
                  icon={fabOpen ? "close" : "dots-vertical"}
                  color={theme.colors.onPrimary}
                  fabStyle={{ backgroundColor: theme.colors.primary }}
                  actions={[
                    {
                      icon: "plus",
                      label: "Add Item",
                      onPress: () => {
                        setEditingItem(undefined);
                        setIsItemModalVisible(true);
                      },
                      color: theme.colors.onPrimary,
                      style: { backgroundColor: theme.colors.primary },
                    },
                    {
                      icon: "share-variant",
                      label: "Share Wishlist",
                      onPress: () => {
                        void handleShare();
                      },
                      color: theme.colors.onPrimary,
                      style: { backgroundColor: theme.colors.primary },
                    },
                    {
                      icon: "pencil",
                      label: "Edit Wishlist",
                      onPress: () => {
                        setIsEditing(true);
                      },
                      color: theme.colors.onPrimary,
                      style: { backgroundColor: theme.colors.primary },
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
                  commonStyles.modalContent,
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
                  commonStyles.modalContent,
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
            <ItemDetailModal
              visible={isDetailModalVisible}
              item={editingItem ?? null}
              onDismiss={() => {
                setIsDetailModalVisible(false);
              }}
              onEdit={(item) => {
                setEditingItem(item);
                setIsItemModalVisible(true);
              }}
            />

            <Portal>
              <Dialog
                visible={isUsernameDialogVisible}
                onDismiss={() => {
                  setIsUsernameDialogVisible(false);
                }}
              >
                <Dialog.Title>Edit Username</Dialog.Title>
                <Dialog.Content>
                  <TextInput
                    label="Username"
                    value={newUsername}
                    onChangeText={(text) => {
                      setNewUsername(text);
                      if (usernameError) setUsernameError(null);
                    }}
                    autoCapitalize="none"
                    mode="outlined"
                    error={!!usernameError}
                  />
                  <HelperText type="error" visible={!!usernameError}>
                    {usernameError}
                  </HelperText>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button
                    onPress={() => {
                      setIsUsernameDialogVisible(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={() => {
                      void handleUpdateUsername();
                    }}
                    loading={isUsernameSaving}
                    disabled={!newUsername.trim() || isUsernameSaving}
                  >
                    Save
                  </Button>
                </Dialog.Actions>
              </Dialog>
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
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
  },
});
