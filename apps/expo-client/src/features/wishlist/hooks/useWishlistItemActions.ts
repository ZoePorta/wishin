import { useCallback } from "react";
import { useAsyncAction } from "../../../hooks/useAsyncAction";

import {
  useWishlistRepository,
  useTransactionRepository,
  useStorageRepository,
} from "../../../contexts/WishlistRepositoryContext";
import {
  AddWishlistItemUseCase,
  UpdateWishlistItemUseCase,
  RemoveWishlistItemUseCase,
} from "@wishin/domain";
import type {
  AddWishlistItemInput,
  UpdateWishlistItemInput,
  RemoveWishlistItemInput,
} from "@wishin/domain";

/**
 * Custom hook to encapsulate wishlist item management use cases.
 *
 * @returns An object containing actions for adding, updating, and removing items.
 */
export function useWishlistItemActions() {
  const wishlistRepository = useWishlistRepository();
  const transactionRepository = useTransactionRepository();
  const storageRepository = useStorageRepository();
  const { loading, error, wrapAsyncAction } = useAsyncAction();

  const addItem = useCallback(
    wrapAsyncAction("addItem", async (input: AddWishlistItemInput) => {
      const useCase = new AddWishlistItemUseCase(wishlistRepository);
      return await useCase.execute(input);
    }),
    [wishlistRepository, wrapAsyncAction],
  );

  const updateItem = useCallback(
    wrapAsyncAction("updateItem", async (input: UpdateWishlistItemInput) => {
      const useCase = new UpdateWishlistItemUseCase(
        wishlistRepository,
        transactionRepository,
        storageRepository,
      );
      return await useCase.execute(input);
    }),
    [
      wishlistRepository,
      transactionRepository,
      storageRepository,
      wrapAsyncAction,
    ],
  );

  const removeItem = useCallback(
    wrapAsyncAction("removeItem", async (input: RemoveWishlistItemInput) => {
      const useCase = new RemoveWishlistItemUseCase(
        wishlistRepository,
        storageRepository,
      );
      return await useCase.execute(input);
    }),
    [wishlistRepository, storageRepository, wrapAsyncAction],
  );

  return {
    addItem,
    updateItem,
    removeItem,
    loading,
    error,
  };
}
