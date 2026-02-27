import { useCallback } from "react";
import { UniversalAlert } from "../../../utils/Alert";
import { useUser } from "../../../contexts/UserContext";
import { useWishlistByOwner } from "./useWishlistByOwner";
import { useCreateWishlist } from "./useCreateWishlist";
import { useUpdateWishlist } from "./useUpdateWishlist";
import { useWishlistItemActions } from "./useWishlistItemActions";
import type {
  CreateWishlistInput,
  AddWishlistItemInput,
  UpdateWishlistInput,
  UpdateWishlistItemInput,
} from "@wishin/domain";

/**
 * View Model hook for the Owner Dashboard.
 * Encapsulates data fetching and business logic orchestration.
 */
export function useOwnerDashboard() {
  const { userId, loading: userLoading, error: userError } = useUser();
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
    updateItem,
    removeItem,
    loading: itemActionLoading,
  } = useWishlistItemActions();

  const handleCreate = useCallback(
    async (data: CreateWishlistInput) => {
      const result = await createWishlist(data);
      if (result) {
        void refetch();
      }
    },
    [createWishlist, refetch],
  );
  const handleUpdate = useCallback(
    async (data: UpdateWishlistInput) => {
      const result = await updateWishlist(data);
      if (result) {
        void refetch();
      }
      return result;
    },
    [updateWishlist, refetch],
  );
  const handleAddItem = useCallback(
    async (data: AddWishlistItemInput) => {
      const result = await addItem(data);
      if (result) {
        void refetch();
      }
    },
    [addItem, refetch],
  );
  const handleUpdateItem = useCallback(
    async (data: UpdateWishlistItemInput) => {
      const result = await updateItem(data);
      if (result) {
        void refetch();
      }
    },
    [updateItem, refetch],
  );

  const handleRemoveItem = useCallback(
    (itemId: string) => {
      UniversalAlert.alert(
        "Remove Item",
        "Are you sure you want to remove this item?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              const wishlistId = wishlist?.id;
              if (!wishlistId) return;
              void removeItem({ wishlistId, itemId }).then((result) => {
                if (result) {
                  void refetch();
                } else {
                  UniversalAlert.alert(
                    "Error",
                    "Failed to remove the item. Please try again.",
                  );
                }
              });
            },
          },
        ],
      );
    },
    [wishlist?.id, removeItem, refetch],
  );

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
    handleUpdateItem,
    handleRemoveItem,
    refetch,
  };
}
