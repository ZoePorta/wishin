import { useState, useEffect, useCallback, useRef } from "react";
import { useWishlistRepository } from "../contexts/WishlistRepositoryContext";
import { WishlistOutputMapper } from "@wishin/domain";
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
  const repository = useWishlistRepository();
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
      const data = await repository.findById(id);

      if (fetchId === fetchIdRef.current) {
        if (data) {
          setWishlist(WishlistOutputMapper.toDTO(data));
        } else {
          setWishlist(null);
        }
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        console.error("Error fetching wishlist:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [id, repository]);

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
