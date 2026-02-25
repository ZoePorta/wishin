import { useState, useCallback } from "react";
import {
  useWishlistRepository,
  useTransactionRepository,
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
  WishlistOutput,
} from "@wishin/domain";

/**
 * Custom hook to encapsulate wishlist item management use cases.
 *
 * @returns An object containing actions for adding, updating, and removing items.
 */
export function useWishlistItemActions() {
  const wishlistRepository = useWishlistRepository();
  const transactionRepository = useTransactionRepository();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = useCallback(
    async (input: AddWishlistItemInput): Promise<WishlistOutput | null> => {
      setLoading(true);
      setError(null);
      try {
        const useCase = new AddWishlistItemUseCase(wishlistRepository);
        const result = await useCase.execute(input);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setError(message);
        console.error("Error adding item:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wishlistRepository],
  );

  const updateItem = useCallback(
    async (input: UpdateWishlistItemInput): Promise<WishlistOutput | null> => {
      setLoading(true);
      setError(null);
      try {
        const useCase = new UpdateWishlistItemUseCase(
          wishlistRepository,
          transactionRepository,
        );
        const result = await useCase.execute(input);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setError(message);
        console.error("Error updating item:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wishlistRepository, transactionRepository],
  );

  const removeItem = useCallback(
    async (input: RemoveWishlistItemInput): Promise<WishlistOutput | null> => {
      setLoading(true);
      setError(null);
      try {
        const useCase = new RemoveWishlistItemUseCase(wishlistRepository);
        const result = await useCase.execute(input);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setError(message);
        console.error("Error removing item:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wishlistRepository],
  );

  return {
    addItem,
    updateItem,
    removeItem,
    loading,
    error,
  };
}
