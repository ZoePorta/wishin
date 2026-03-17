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
 * @returns An object containing the purchase action, loading state, and error.
 */
export function usePurchaseItem() {
  const wishlistRepository = useWishlistRepository();
  const profileRepository = useProfileRepository();
  const transactionRepository = useTransactionRepository();
  const logger = useLogger();
  const observability = useObservability();
  const { loading, error, wrapAsyncAction } = useAsyncAction();

  const purchaseItem = useCallback(
    wrapAsyncAction("purchaseItem", async (input: PurchaseItemInput) => {
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
      wrapAsyncAction,
    ],
  );

  return {
    purchaseItem,
    loading,
    error,
  };
}
