import { useState, useCallback } from "react";
import { useWishlistRepository } from "../../../contexts/WishlistRepositoryContext";
import { CreateWishlistUseCase } from "@wishin/domain";
import type { CreateWishlistInput, WishlistOutput } from "@wishin/domain";

/**
 * Custom hook to encapsulate the CreateWishlist use case logic.
 *
 * @returns An object containing the creation function, loading state, and error.
 */
export function useCreateWishlist() {
  const repository = useWishlistRepository();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWishlist = useCallback(
    async (input: CreateWishlistInput): Promise<WishlistOutput | null> => {
      setLoading(true);
      setError(null);

      try {
        const useCase = new CreateWishlistUseCase(repository);
        const result = await useCase.execute(input);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setError(message);
        console.error("Error creating wishlist:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [repository],
  );

  return {
    createWishlist,
    loading,
    error,
  };
}
