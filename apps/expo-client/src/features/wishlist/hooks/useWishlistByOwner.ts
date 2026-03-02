import { useState, useEffect, useCallback, useRef } from "react";
import { useWishlistRepository } from "../../../contexts/WishlistRepositoryContext";
import { GetWishlistByOwnerUseCase } from "@wishin/domain";
import type { WishlistOutput } from "@wishin/domain";

/**
 * Hook to retrieve a wishlist by owner ID.
 *
 * @param ownerId - The owner's unique identifier.
 * @returns An object containing the wishlist, loading state, error, and refetch function.
 */
export function useWishlistByOwner(ownerId: string | null) {
  const repository = useWishlistRepository();
  const [wishlist, setWishlist] = useState<WishlistOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWishlist = useCallback(
    async (isIgnored: () => boolean = () => false) => {
      if (!ownerId) {
        if (!isIgnored()) {
          setWishlist(null);
          setLoading(false);
        }
        return;
      }

      if (!isIgnored()) {
        setLoading(true);
        setError(null);
      }

      try {
        const useCase = new GetWishlistByOwnerUseCase(repository);
        const result = await useCase.execute({ ownerId });
        if (!isIgnored()) setWishlist(result);
      } catch (err) {
        if (!isIgnored()) {
          const message =
            err instanceof Error ? err.message : "An error occurred";
          setError(message);
          console.error("Error fetching wishlist by owner:", err);
        }
      } finally {
        if (!isIgnored()) setLoading(false);
      }
    },
    [ownerId, repository],
  );

  const isIgnoredRef = useRef(false);

  useEffect(() => {
    isIgnoredRef.current = false;
    void loadWishlist(() => isIgnoredRef.current);
    return () => {
      isIgnoredRef.current = true;
    };
  }, [loadWishlist]);

  const refetch = useCallback(
    () => loadWishlist(() => isIgnoredRef.current),
    [loadWishlist],
  );

  return { wishlist, loading, error, refetch };
}
