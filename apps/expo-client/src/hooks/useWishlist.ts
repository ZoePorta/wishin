import { useState, useEffect, useCallback, useRef } from "react";
import { useRepositories } from "../contexts/WishlistRepositoryContext";
import { GetWishlistByUUIDUseCase } from "@wishin/domain";
import type { WishlistOutput } from "@wishin/domain";

/**
 * Interface for the object returned by the useWishlist hook.
 */
export interface UseWishlistReturn {
  wishlist: WishlistOutput | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to manage wishlist data and state.
 *
 * @param id - The unique identifier of the wishlist to fetch.
 * @returns An object containing the wishlist data, loading state, error message, and a refetch function.
 */
export function useWishlist(id: string): UseWishlistReturn {
  const { wishlistRepository, profileRepository } = useRepositories();
  const [wishlist, setWishlist] = useState<WishlistOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const loadWishlist = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError(null);
      setWishlist(null);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    try {
      setLoading(true);
      setError(null);

      const useCase = new GetWishlistByUUIDUseCase(
        wishlistRepository,
        profileRepository,
      );
      const data = await useCase.execute({ id });

      if (fetchId === fetchIdRef.current) {
        setWishlist(data);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        // Handle 404 specially if needed, but GetWishlistByUUIDUseCase throws NotFoundError
        console.error("Error fetching wishlist:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setWishlist(null);
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [id, wishlistRepository, profileRepository]);

  useEffect(() => {
    void loadWishlist();
    return () => {
      fetchIdRef.current++;
    };
  }, [loadWishlist]);

  return {
    wishlist,
    loading,
    error,
    refetch: loadWishlist,
  };
}
