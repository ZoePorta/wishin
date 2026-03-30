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
import type { PurchaseItemInput, PurchaseItemOutput } from "@wishin/domain";

/**
 * Return type for the usePurchaseItem hook.
 */
export interface UsePurchaseItemReturn {
  /** The function to execute the purchase. */
  purchaseItem: (input: PurchaseItemInput) => Promise<PurchaseItemOutput>;
  /** Whether the purchase is in progress. */
  loading: boolean;
  /** The error message if the purchase failed, or null. */
  error: string | null;
}

/**
 * Custom hook to coordinate the purchase item use case.
 *
 * @returns {UsePurchaseItemReturn} An object containing the purchase action, loading state, and error.
 */
export function usePurchaseItem(): UsePurchaseItemReturn {
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
