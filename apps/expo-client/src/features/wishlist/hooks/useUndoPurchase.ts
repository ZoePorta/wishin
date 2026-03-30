import { useCallback } from "react";
import { useAsyncAction } from "../../../hooks/useAsyncAction";
import {
  useWishlistRepository,
  useTransactionRepository,
  useLogger,
  useObservability,
} from "../../../contexts/WishlistRepositoryContext";
import { UndoPurchaseUseCase } from "@wishin/domain";
import type { UndoPurchaseInput } from "@wishin/domain";

/**
 * Return type for the useUndoPurchase hook.
 */
export interface UseUndoPurchaseReturn {
  /** The function to execute the undo purchase. */
  undoPurchase: (input: UndoPurchaseInput) => Promise<void>;
  /** Whether the undo is in progress. */
  loading: boolean;
  /** The error message if the undo failed, or null. */
  error: string | null;
}

/**
 * Custom hook to coordinate the undo purchase use case.
 *
 * @returns {UseUndoPurchaseReturn} An object containing the undo action, loading state, and error.
 */
export function useUndoPurchase(): UseUndoPurchaseReturn {
  const wishlistRepository = useWishlistRepository();
  const transactionRepository = useTransactionRepository();
  const logger = useLogger();
  const observability = useObservability();
  const { loading, error, wrapAsyncActionEx } = useAsyncAction();

  const undoPurchase = useCallback(
    wrapAsyncActionEx("undoPurchase", async (input: UndoPurchaseInput) => {
      const useCase = new UndoPurchaseUseCase(
        wishlistRepository,
        transactionRepository,
        logger,
        observability,
      );
      await useCase.execute(input);
    }),
    [
      wishlistRepository,
      transactionRepository,
      logger,
      observability,
      wrapAsyncActionEx,
    ],
  );

  return {
    undoPurchase,
    loading,
    error,
  };
}
