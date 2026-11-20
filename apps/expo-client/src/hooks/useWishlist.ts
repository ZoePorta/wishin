import { useState, useEffect, useCallback, useRef } from "react";
import { useRepositories } from "../contexts/WishlistRepositoryContext";
import { GetWishlistByUUIDUseCase } from "@wishin/domain";
import type { WishlistItemOutput, WishlistOutput } from "@wishin/domain";
import {
  mergeServerWishlist,
  replaceItem,
  type PendingItemSync,
} from "../features/wishlist/utils/pending-item-sync";

/**
 * Waits between server checks while an optimistic item is pending. Purchase stats
 * are written asynchronously by an Appwrite Function (ADR 025), which can take a
 * few seconds on a cold start. Total ≈ 12 s before giving up and trusting the server.
 */
const SYNC_DELAYS_MS = [400, 800, 1200, 2000, 3000, 5000];

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Interface for the object returned by the useWishlist hook.
 */
export interface UseWishlistReturn {
  wishlist: WishlistOutput | null;
  loading: boolean;
  error: string | null;
  /** Whether a user-initiated refresh (see `refresh`) is in progress. */
  refreshing: boolean;
  /** Full reload: shows the loading state and replaces data/error. */
  refetch: () => Promise<void>;
  /**
   * Reload that keeps the current data on screen (pull-to-refresh). Sets
   * `refreshing` while it runs. On failure the current data is kept.
   *
   * @returns `true` if fresh data was loaded, `false` on failure or if superseded.
   */
  refresh: () => Promise<boolean>;
  /**
   * Shows `next` immediately in place of the item with the same id, then polls the
   * server in the background (no `refreshing` indicator) until it reflects the change,
   * i.e. its `purchasedQuantity` moves away from `previous.purchasedQuantity`.
   * Server responses that are still stale never overwrite the optimistic item; if the
   * server never catches up, its data wins after the last attempt.
   *
   * @param next - The item state to show now (e.g. the use case's post-purchase item).
   * @param previous - The item state the server still has (before the change).
   */
  applyOptimisticItem: (
    next: WishlistItemOutput,
    previous: WishlistItemOutput,
  ) => void;
}

/**
 * Custom hook to manage wishlist data and state.
 *
 * @param id - The unique identifier of the wishlist to fetch.
 * @returns An object containing the wishlist data, loading/refreshing state, error message,
 *          and the `refetch` (full) and `refresh` (background) functions.
 */
export function useWishlist(id: string): UseWishlistReturn {
  const { wishlistRepository, profileRepository } = useRepositories();
  const [wishlist, setWishlist] = useState<WishlistOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fetchIdRef = useRef(0);
  const syncRunRef = useRef(0);
  const pendingRef = useRef<PendingItemSync[]>([]);

  const fetchFromServer = useCallback(
    () =>
      new GetWishlistByUUIDUseCase(
        wishlistRepository,
        profileRepository,
      ).execute({ id }),
    [id, wishlistRepository, profileRepository],
  );

  /** Shows server data, except for items whose optimistic state it hasn't caught up with. */
  const applyServerData = useCallback((data: WishlistOutput) => {
    const merged = mergeServerWishlist(data, pendingRef.current);
    pendingRef.current = merged.pending;
    setWishlist(merged.wishlist);
  }, []);

  const loadWishlist = useCallback(
    async (silent: boolean): Promise<boolean> => {
      if (!id) {
        setLoading(false);
        setRefreshing(false);
        setError(null);
        setWishlist(null);
        return false;
      }

      const fetchId = ++fetchIdRef.current;
      const isCurrent = () => fetchId === fetchIdRef.current;
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
          setError(null);
        }

        const data = await fetchFromServer();

        if (!isCurrent()) return false;
        applyServerData(data);
        setError(null);
        return true;
      } catch (err) {
        if (isCurrent()) {
          console.error("Error fetching wishlist:", err);
          // A failed background refresh keeps the data already on screen.
          if (!silent) {
            // Handle 404 specially if needed, but GetWishlistByUUIDUseCase throws NotFoundError
            setError(err instanceof Error ? err.message : "An error occurred");
            setWishlist(null);
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
    [id, fetchFromServer, applyServerData],
  );

  /** Polls until every pending optimistic item is reflected by the server. */
  const syncPending = useCallback(async () => {
    const runId = ++syncRunRef.current;
    const isCurrent = () => runId === syncRunRef.current;
    let lastData: WishlistOutput | null = null;

    for (const delay of SYNC_DELAYS_MS) {
      await wait(delay);
      if (!isCurrent()) return;
      try {
        lastData = await fetchFromServer();
        if (!isCurrent()) return;
        applyServerData(lastData);
        if (pendingRef.current.length === 0) return;
      } catch (err) {
        console.warn("Background wishlist sync failed, retrying:", err);
      }
    }

    // The server never caught up: it remains the source of truth.
    if (!isCurrent()) return;
    console.warn("Wishlist sync timed out; showing server data.");
    pendingRef.current = [];
    if (lastData) setWishlist(lastData);
  }, [fetchFromServer, applyServerData]);

  const applyOptimisticItem = useCallback(
    (next: WishlistItemOutput, previous: WishlistItemOutput) => {
      pendingRef.current = [
        ...pendingRef.current.filter((p) => p.itemId !== next.id),
        {
          itemId: next.id,
          staleQuantity: previous.purchasedQuantity,
          optimistic: next,
        },
      ];
      setWishlist((current) =>
        current ? replaceItem(current, next) : current,
      );
      void syncPending();
    },
    [syncPending],
  );

  const refetch = useCallback(async () => {
    await loadWishlist(false);
  }, [loadWishlist]);

  const refresh = useCallback(() => loadWishlist(true), [loadWishlist]);

  useEffect(() => {
    void loadWishlist(false);
    return () => {
      fetchIdRef.current++;
      // Stop syncing items of a wishlist that is no longer shown.
      syncRunRef.current++;
      pendingRef.current = [];
    };
  }, [loadWishlist]);

  return {
    wishlist,
    loading,
    error,
    refreshing,
    refetch,
    refresh,
    applyOptimisticItem,
  };
}
