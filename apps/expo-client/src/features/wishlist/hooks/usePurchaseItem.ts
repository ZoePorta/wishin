import { useCallback } from "react";
import { useAsyncAction } from "../../../hooks/useAsyncAction";
import {
  useWishlistRepository,
  useProfileRepository,
  useTransactionRepository,
  useLogger,
  useObservability,
} from "../../../contexts/WishlistRepositoryContext";
import { PurchaseItemUseCase } from "@wishin/domain";
import type { PurchaseItemInput } from "@wishin/domain";

/**
 * Custom hook to coordinate the purchase item use case.
 *
 * @param {PurchaseItemInput} purchaseItem - The input object for the purchase operation.
 * @param {string} purchaseItem.wishlistId - The ID of the wishlist.
 * @param {string} purchaseItem.itemId - The ID of the item to purchase.
 * @param {string} purchaseItem.userId - The ID of the user (purchaser).
 * @param {number} purchaseItem.quantity - The quantity to purchase.
 * @returns An object containing the purchase action, loading state, and error.
 */
export function usePurchaseItem() {
  const wishlistRepository = useWishlistRepository();
  const profileRepository = useProfileRepository();
  const transactionRepository = useTransactionRepository();
  const logger = useLogger();
  const observability = useObservability();
  const { loading, error, wrapAsyncActionEx } = useAsyncAction();

  const purchaseItem = useCallback(
    wrapAsyncActionEx("purchaseItem", async (input: PurchaseItemInput) => {
      const useCase = new PurchaseItemUseCase(
        wishlistRepository,
        profileRepository,
        transactionRepository,
        logger,
        observability,
      );
      return await useCase.execute(input);
    }),
    [
      wishlistRepository,
      profileRepository,
      transactionRepository,
      logger,
      observability,
      wrapAsyncActionEx,
    ],
  );

  return {
    purchaseItem,
    loading,
    error,
  };
}
