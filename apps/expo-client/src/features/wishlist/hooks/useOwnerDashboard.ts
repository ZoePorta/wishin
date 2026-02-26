import { Alert } from "react-native";
import { useCurrentUserId } from "../../../hooks/useCurrentUserId";
import { useWishlistByOwner } from "./useWishlistByOwner";
import { useCreateWishlist } from "./useCreateWishlist";
import { useUpdateWishlist } from "./useUpdateWishlist";
import { useWishlistItemActions } from "./useWishlistItemActions";
import type {
  CreateWishlistInput,
  AddWishlistItemInput,
  UpdateWishlistInput,
} from "@wishin/domain";

/**
 * View Model hook for the Owner Dashboard.
 * Encapsulates data fetching and business logic orchestration.
 */
export function useOwnerDashboard() {
  const { userId, loading: userLoading, error: userError } = useCurrentUserId();
  const {
    wishlist,
    loading: wishlistLoading,
    error: wishlistError,
    refetch,
  } = useWishlistByOwner(userId);

  const { createWishlist, loading: creating } = useCreateWishlist();
  const { updateWishlist, loading: updating } = useUpdateWishlist();
  const {
    addItem,
    removeItem,
    loading: itemActionLoading,
  } = useWishlistItemActions();

  const handleCreate = async (data: CreateWishlistInput) => {
    const result = await createWishlist(data);
    if (result) {
      void refetch();
    }
  };

  const handleUpdate = async (data: UpdateWishlistInput) => {
    const result = await updateWishlist(data);
    if (result) {
      void refetch();
    }
    return result;
  };

  const handleAddItem = async (data: AddWishlistItemInput) => {
    const result = await addItem(data);
    if (result) {
      void refetch();
    }
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert("Remove Item", "Are you sure you want to remove this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          if (!wishlist) return;
          void removeItem({ wishlistId: wishlist.id, itemId }).then(
            (result) => {
              if (result) {
                void refetch();
              }
            },
          );
        },
      },
    ]);
  };

  return {
    userId,
    wishlist,
    loading: userLoading || (wishlistLoading && userId !== null),
    error: userError ?? wishlistError,
    creating: creating || updating,
    itemActionLoading,
    handleCreate,
    handleUpdate,
    handleAddItem,
    handleRemoveItem,
    refetch,
  };
}
