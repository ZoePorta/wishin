import { useCallback } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const {
    userId,
    loading: userLoading,
    error: userError,
    isSessionReliable,
  } = useUser();
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
        t("dashboard.removeItem.title"),
        t("dashboard.removeItem.message"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("dashboard.removeItem.confirm"),
            style: "destructive",
            onPress: () => {
              void (async () => {
                const wishlistId = wishlist?.id;
                if (!wishlistId) {
                  UniversalAlert.alert(
                    t("common.error"),
                    t("dashboard.removeItem.noWishlist"),
                  );
                  return;
                }
                try {
                  const result = await removeItem({ wishlistId, itemId });
                  if (result) {
                    void refetch();
                  } else {
                    UniversalAlert.alert(
                      t("common.error"),
                      t("dashboard.removeItem.failed"),
                    );
                  }
                } catch (_) {
                  UniversalAlert.alert(
                    t("common.error"),
                    t("dashboard.removeItem.failed"),
                  );
                }
              })();
            },
          },
        ],
      );
    },
    [wishlist?.id, removeItem, refetch, t],
  );

  return {
    userId,
    wishlist,
    loading:
      userLoading || !isSessionReliable || (wishlistLoading && userId !== null),
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
