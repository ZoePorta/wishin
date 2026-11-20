import { useState, useEffect, useCallback, useRef } from "react";
import { useRepositories } from "../../../contexts/WishlistRepositoryContext";
import { GetWishlistByOwnerUseCase } from "@wishin/domain";
import type { WishlistOutput } from "@wishin/domain";

/**
 * Hook to retrieve a wishlist by owner ID.
 *
 * @param ownerId - The owner's unique identifier.
 * @returns An object containing the wishlist, loading/refreshing state, error, `refetch`
 *          (full reload, shows the loading state) and `refresh` (background reload that
 *          keeps the current data on screen; resolves `true` on success, keeps data on failure).
 */
export function useWishlistByOwner(ownerId: string | null) {
  const { wishlistRepository, profileRepository } = useRepositories();
  const [wishlist, setWishlist] = useState<WishlistOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const lastRequestId = useRef(0);
  const isMounted = useRef(true);

  const loadWishlist = useCallback(
    async (silent: boolean): Promise<boolean> => {
      const requestId = ++lastRequestId.current;
      const isCurrent = () =>
        isMounted.current && requestId === lastRequestId.current;

      if (!ownerId) {
        if (isCurrent()) {
          setWishlist(null);
          setLoading(false);
          setRefreshing(false);
          setError(null);
        }
        return false;
      }

      if (isCurrent()) {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
          setError(null);
        }
      }

      try {
        const useCase = new GetWishlistByOwnerUseCase(
          wishlistRepository,
          profileRepository,
        );
        const result = await useCase.execute({ ownerId });
        if (!isCurrent()) return false;
        setWishlist(result);
        setError(null);
        return true;
      } catch (err) {
        if (isCurrent()) {
          console.error("Error fetching wishlist by owner:", err);
          // A failed background refresh keeps the data already on screen.
          if (!silent) {
            const message =
              err instanceof Error ? err.message : "An error occurred";
            setError(message);
          }
        }
        return false;
      } finally {
        if (isCurrent()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [ownerId, wishlistRepository, profileRepository],
  );

  useEffect(() => {
    isMounted.current = true;
    void loadWishlist(false);
    return () => {
      isMounted.current = false;
    };
  }, [loadWishlist]);

  const refetch = useCallback(async () => {
    await loadWishlist(false);
  }, [loadWishlist]);
  const refresh = useCallback(() => loadWishlist(true), [loadWishlist]);

  return { wishlist, loading, error, refreshing, refetch, refresh };
}
