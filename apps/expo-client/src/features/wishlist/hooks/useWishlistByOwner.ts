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

  const lastRequestId = useRef(0);
  const isMounted = useRef(true);

  const loadWishlist = useCallback(async () => {
    const requestId = ++lastRequestId.current;
    const isCurrent = () =>
      isMounted.current && requestId === lastRequestId.current;

    if (!ownerId) {
      if (isCurrent()) {
        setWishlist(null);
        setLoading(false);
      }
      return;
    }

    if (isCurrent()) {
      setLoading(true);
      setError(null);
    }

    try {
      const useCase = new GetWishlistByOwnerUseCase(repository);
      const result = await useCase.execute({ ownerId });
      if (isCurrent()) setWishlist(result);
    } catch (err) {
      if (isCurrent()) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setError(message);
        console.error("Error fetching wishlist by owner:", err);
      }
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [ownerId, repository]);

  useEffect(() => {
    isMounted.current = true;
    void loadWishlist();
    return () => {
      isMounted.current = false;
    };
  }, [loadWishlist]);

  const refetch = useCallback(() => loadWishlist(), [loadWishlist]);

  return { wishlist, loading, error, refetch };
}
