import { useState, useCallback } from "react";
import {
  UpdateWishlistUseCase,
  type UpdateWishlistInput,
  type WishlistOutput,
} from "@wishin/domain";
import { useRepositories } from "../../../contexts/WishlistRepositoryContext";

/**
 * Hook for updating an existing wishlist.
 */
export function useUpdateWishlist() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { wishlistRepository } = useRepositories();

  const updateWishlist = useCallback(
    async (input: UpdateWishlistInput): Promise<WishlistOutput | null> => {
      setLoading(true);
      setError(null);
      try {
        const useCase = new UpdateWishlistUseCase(wishlistRepository);
        const result = await useCase.execute(input);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setError(message);
        console.error("Error updating wishlist:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wishlistRepository],
  );

  return { updateWishlist, loading, error };
}
