import { useState, useEffect, useCallback, useRef } from "react";
import { useRepositories } from "../contexts/WishlistRepositoryContext";
import { GetWishlistByUUIDUseCase } from "@wishin/domain";
import type { WishlistOutput } from "@wishin/domain";
import {
  WishlistSync,
  type ItemChange,
} from "../features/wishlist/utils/pending-item-sync";
import type { RefreshOutcome } from "../features/wishlist/utils/refresh-outcome";

/**
 * Waits between server checks while an optimistic change is pending. Purchase stats
 * are written asynchronously by an Appwrite Function (ADR 028; see ADR 032), which can take a
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
   * @returns The {@link RefreshOutcome}; only `failed` is worth reporting to the user.
   */
  refresh: () => Promise<RefreshOutcome>;
  /**
   * Shows a persisted purchase/undo immediately, then polls the server in the
   * background (no `refreshing` indicator) until it reflects the change. Stale server
   * responses never overwrite it; if the server never catches up, its data wins after
   * the last attempt (ADR 032).
   *
   * @param change - The change that was just persisted.
   */
  applyOptimisticChange: (change: ItemChange) => void;
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
  const syncRef = useRef(new WishlistSync());
  const pollingRef = useRef(false);
  // Set below; lets a successful load resume polling for leftover pending changes.
  const syncPendingRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const fetchFromServer = useCallback(
    () =>
      new GetWishlistByUUIDUseCase(
        wishlistRepository,
        profileRepository,
      ).execute({ id }),
    [id, wishlistRepository, profileRepository],
  );

  const loadWishlist = useCallback(
    async (silent: boolean): Promise<RefreshOutcome> => {
      if (!id) {
        setLoading(false);
        setRefreshing(false);
        setError(null);
        setWishlist(null);
        return "superseded";
      }

      const sync = syncRef.current;
      const fetchId = ++fetchIdRef.current;
      const requestId = sync.beginRequest();
      const isCurrent = () => fetchId === fetchIdRef.current;
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
          setError(null);
        }

        const data = await fetchFromServer();

        if (!isCurrent() || !sync.acceptResponse(requestId, data)) {
          return "superseded";
        }
        setWishlist(sync.displayed);
        setError(null);
        // Changes left pending by a poll that never reached the server.
        if (sync.hasPending() && !pollingRef.current) {
          void syncPendingRef.current();
        }
        return "success";
      } catch (err) {
        if (!isCurrent() || sync.isSuperseded(requestId)) return "superseded";
        console.error("Error fetching wishlist:", err);
        // A failed background refresh keeps the data already on screen.
        if (!silent) {
          // Handle 404 specially if needed, but GetWishlistByUUIDUseCase throws NotFoundError
          setError(err instanceof Error ? err.message : "An error occurred");
          setWishlist(null);
        }
        return "failed";
      } finally {
        if (isCurrent()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [id, fetchFromServer],
  );

  /** Polls until every pending change is reflected by the server. */
  const syncPending = useCallback(async () => {
    const sync = syncRef.current;
    const runId = ++syncRunRef.current;
    const isCurrent = () => runId === syncRunRef.current;
    let received = false;
    pollingRef.current = true;

    try {
      for (const delay of SYNC_DELAYS_MS) {
        await wait(delay);
        // A refresh may have synced everything meanwhile.
        if (!isCurrent() || !sync.hasPending()) return;
        try {
          const requestId = sync.beginRequest();
          const data = await fetchFromServer();
          if (!isCurrent()) return;
          received = true;
          if (sync.acceptResponse(requestId, data)) {
            setWishlist(sync.displayed);
          }
          if (!sync.hasPending()) return;
        } catch (err) {
          console.warn("Background wishlist sync failed, retrying:", err);
        }
      }

      if (!isCurrent()) return;
      if (!received) {
        // Every attempt failed, so the last server data predates the change. Keep it
        // pending; the next successful load shows the server data and resumes polling.
        console.warn("Wishlist sync could not reach the server; will retry.");
        return;
      }
      // The server never caught up: it remains the source of truth.
      console.warn("Wishlist sync timed out; showing server data.");
      sync.dropPending();
      setWishlist(sync.displayed);
    } finally {
      if (isCurrent()) pollingRef.current = false;
    }
  }, [fetchFromServer]);
  syncPendingRef.current = syncPending;

  const applyOptimisticChange = useCallback(
    (change: ItemChange) => {
      const sync = syncRef.current;
      sync.record(change);
      if (!sync.hasPending()) return;
      setWishlist(sync.displayed);
      void syncPending();
    },
    [syncPending],
  );

  const refetch = useCallback(async () => {
    await loadWishlist(false);
  }, [loadWishlist]);

  const refresh = useCallback(() => loadWishlist(true), [loadWishlist]);

  useEffect(() => {
    const sync = syncRef.current;
    void loadWishlist(false);
    return () => {
      fetchIdRef.current++;
      // Stop syncing items of a wishlist that is no longer shown.
      syncRunRef.current++;
      pollingRef.current = false;
      sync.reset();
    };
  }, [loadWishlist]);

  return {
    wishlist,
    loading,
    error,
    refreshing,
    refetch,
    refresh,
    applyOptimisticChange,
  };
}
