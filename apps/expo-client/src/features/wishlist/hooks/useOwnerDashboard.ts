import { useCallback } from "react";
import { UniversalAlert } from "../../../utils/Alert";
import { useUser } from "../../../contexts/UserContext";
import { useWishlistByOwner } from "./useWishlistByOwner";
import { useCreateWishlist } from "./useCreateWishlist";
import { useUpdateWishlist } from "./useUpdateWishlist";
import { useWishlistItemActions } from "./useWishlistItemActions";

/**
 * View Model hook for the Owner Dashboard.
 * Encapsulates data fetching and business logic orchestration.
 *
 * @returns An object containing the current user's ID, wishlist state, loading/error states,
 *          and handlers for CRUD operations on wishlist and items.
 * @throws {Error} If called outside of a UserProvider.
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

  const wrapMutateWithRefetch = useCallback(
    <T, R>(mutate: (data: T) => Promise<R>) => {
      return async (data: T) => {
        const result = await mutate(data);
        const res = result as unknown;
        const success =
          typeof res === "boolean" ? res : res !== null && res !== undefined;

        if (success) {
          void refetch();
        }
        return result;
      };
    },
    [refetch],
  );

  const handleCreate = useCallback(wrapMutateWithRefetch(createWishlist), [
    wrapMutateWithRefetch,
    createWishlist,
  ]);
  const handleUpdate = useCallback(wrapMutateWithRefetch(updateWishlist), [
    wrapMutateWithRefetch,
    updateWishlist,
  ]);
  const handleAddItem = useCallback(wrapMutateWithRefetch(addItem), [
    wrapMutateWithRefetch,
    addItem,
  ]);
  const handleUpdateItem = useCallback(wrapMutateWithRefetch(updateItem), [
    wrapMutateWithRefetch,
    updateItem,
  ]);

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
              void (async () => {
                const wishlistId = wishlist?.id;
                if (!wishlistId) {
                  UniversalAlert.alert(
                    "Error",
                    "Unable to delete: wishlist not found",
                  );
                  return;
                }
                try {
                  const result = await removeItem({ wishlistId, itemId });
                  if (result) {
                    void refetch();
                  } else {
                    UniversalAlert.alert(
                      "Error",
                      "Failed to remove the item. Please try again.",
                    );
                  }
                } catch (_) {
                  UniversalAlert.alert(
                    "Error",
                    "Failed to remove the item. Please try again.",
                  );
                }
              })();
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
