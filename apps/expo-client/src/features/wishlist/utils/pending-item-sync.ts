import { projectPurchasedQuantity } from "@wishin/domain";
import type { WishlistOutput } from "@wishin/domain";

/**
 * A change made by the current user to an item's purchased quantity.
 */
export interface ItemChange {
  /** The item that changed. */
  itemId: string;
  /** Units purchased (positive) or returned by an undo (negative). */
  delta: number;
  /**
   * `purchasedQuantity` the mutation read from the server before the change.
   * When omitted, the last quantity received from the server is used.
   */
  baselineQuantity?: number;
}

/**
 * The current user's changes to an item that the server has not reflected yet.
 *
 * Purchase stats are updated asynchronously by the `sync-item-stats` Appwrite
 * Function (ADR 028; see ADR 032), so a fetch right after a purchase/undo can still
 * return the old `purchasedQuantity`. Until the server reflects the net change, the
 * expected quantity (`baselineQuantity + delta`) is shown instead.
 */
export interface PendingItemSync {
  /** The item being synced. */
  itemId: string;
  /** `purchasedQuantity` the server had before the first unsynced change. */
  baselineQuantity: number;
  /** Net units added (positive) or removed (negative) by the unsynced changes. */
  delta: number;
}

/**
 * Whether the server quantity reflects a pending entry's net change.
 *
 * Going past the expected quantity also counts, so concurrent purchases by other
 * guests are accepted. A net change of zero (a purchase undone before it synced)
 * cannot be told apart from an unsynced one by quantity alone, so it is held until
 * the caller gives up waiting.
 *
 * @param entry - The pending entry.
 * @param serverQuantity - The `purchasedQuantity` reported by the server.
 * @returns `true` if the server has caught up.
 */
function isSynced(entry: PendingItemSync, serverQuantity: number): boolean {
  const expected = entry.baselineQuantity + entry.delta;
  if (entry.delta > 0) return serverQuantity >= expected;
  if (entry.delta < 0) return serverQuantity <= expected;
  return false;
}

/**
 * Records a change. Repeated unsynced changes to an item accumulate on the original
 * baseline, i.e. what the server had before the first of them.
 *
 * @param pending - Entries not synced yet.
 * @param change - The change that was just persisted.
 * @param server - The last wishlist received from the server.
 * @returns The updated entries; unchanged if the server does not have the item.
 */
export function addPendingChange(
  pending: readonly PendingItemSync[],
  change: ItemChange,
  server: WishlistOutput | null,
): PendingItemSync[] {
  const serverItem = server?.items.find((i) => i.id === change.itemId);
  if (!serverItem) return [...pending];

  const existing = pending.find((p) => p.itemId === change.itemId);
  const baselineQuantity =
    existing?.baselineQuantity ??
    change.baselineQuantity ??
    serverItem.purchasedQuantity;

  return [
    ...pending.filter((p) => p !== existing),
    {
      itemId: change.itemId,
      baselineQuantity,
      delta: (existing?.delta ?? 0) + change.delta,
    },
  ];
}

/**
 * Combines fresh server data with items still waiting for the server to sync.
 *
 * Only the quantities of pending items are replaced; everything else comes from the
 * server. An entry is dropped once the server reflects it or the item is gone.
 *
 * @param server - The wishlist as just returned by the server.
 * @param pending - Changes not synced yet.
 * @returns The wishlist to display and the entries that are still not synced.
 */
export function mergeServerWishlist(
  server: WishlistOutput,
  pending: readonly PendingItemSync[],
): { wishlist: WishlistOutput; pending: PendingItemSync[] } {
  const stillPending = pending.filter((entry) => {
    const serverItem = server.items.find((i) => i.id === entry.itemId);
    return serverItem && !isSynced(entry, serverItem.purchasedQuantity);
  });
  if (stillPending.length === 0) return { wishlist: server, pending: [] };

  const items = server.items.map((item) => {
    const entry = stillPending.find((p) => p.itemId === item.id);
    return entry
      ? projectPurchasedQuantity(item, entry.baselineQuantity + entry.delta)
      : item;
  });
  return { wishlist: { ...server, items }, pending: stillPending };
}

/**
 * Reconciles a wishlist's server responses with the current user's unsynced changes
 * (ADR 032).
 *
 * Invariants:
 * - Responses are applied in **request** order: one requested before an already
 *   applied response is discarded, whichever fetch path (load, refresh, poll) made it.
 * - Pending changes always apply on top of the newest accepted server data.
 */
export class WishlistSync {
  private server: WishlistOutput | null = null;
  private pending: PendingItemSync[] = [];
  private lastRequestId = 0;
  private lastAppliedId = 0;

  /**
   * Registers a request that is about to be sent.
   *
   * @returns The request id to pass to {@link acceptResponse}.
   */
  beginRequest(): number {
    return ++this.lastRequestId;
  }

  /**
   * Whether a newer response has already been applied.
   *
   * @param requestId - Id from {@link beginRequest}.
   * @returns `true` if the request's outcome must be ignored.
   */
  isSuperseded(requestId: number): boolean {
    return requestId <= this.lastAppliedId;
  }

  /**
   * Applies a server response unless it is superseded.
   *
   * @param requestId - Id from {@link beginRequest}.
   * @param data - The server's wishlist.
   * @returns `true` if applied, `false` if discarded.
   */
  acceptResponse(requestId: number, data: WishlistOutput): boolean {
    if (this.isSuperseded(requestId)) return false;
    this.lastAppliedId = requestId;
    this.server = data;
    this.pending = mergeServerWishlist(data, this.pending).pending;
    return true;
  }

  /**
   * Records a change made by the current user.
   *
   * @param change - The change that was just persisted.
   */
  record(change: ItemChange): void {
    this.pending = addPendingChange(this.pending, change, this.server);
  }

  /** Stops waiting for unsynced changes: the server data wins. */
  dropPending(): void {
    this.pending = [];
  }

  /** Forgets all data and discards every response still in flight. */
  reset(): void {
    this.server = null;
    this.pending = [];
    this.lastAppliedId = this.lastRequestId;
  }

  /**
   * Whether any change is still waiting for the server.
   *
   * @returns `true` while there are unsynced changes.
   */
  hasPending(): boolean {
    return this.pending.length > 0;
  }

  /** The wishlist to show, or `null` if nothing has been loaded. */
  get displayed(): WishlistOutput | null {
    return this.server
      ? mergeServerWishlist(this.server, this.pending).wishlist
      : null;
  }
}
