import { useState, useEffect, useCallback, useRef } from "react";
import { useRepositories } from "../../../contexts/WishlistRepositoryContext";
import { GetWishlistByOwnerUseCase } from "@wishin/domain";
import type { WishlistOutput } from "@wishin/domain";

/**
 * Hook to retrieve a wishlist by owner ID.
 *
 * @param ownerId - The owner's unique identifier.
 * @returns An object containing the wishlist, loading state, error, and refetch function.
 */
export function useWishlistByOwner(ownerId: string | null) {
  const { wishlistRepository, profileRepository } = useRepositories();
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
        setError(null);
      }
      return;
    }

    if (isCurrent()) {
      setLoading(true);
      setError(null);
    }

    try {
      const useCase = new GetWishlistByOwnerUseCase(
        wishlistRepository,
        profileRepository,
      );
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
  }, [ownerId, wishlistRepository, profileRepository]);

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
