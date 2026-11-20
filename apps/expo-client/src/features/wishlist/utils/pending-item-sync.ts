import type { WishlistItemOutput, WishlistOutput } from "@wishin/domain";

/**
 * An item shown optimistically while the server catches up.
 *
 * Purchase stats are updated asynchronously by the `sync-item-stats` Appwrite
 * Function (ADR 028; see ADR 032), so a fetch right after a purchase/undo can still return the
 * old `purchasedQuantity`. Until the server value moves away from `staleQuantity`,
 * the optimistic item is shown instead of the server one.
 */
export interface PendingItemSync {
  /** The item being synced. */
  itemId: string;
  /** `purchasedQuantity` the server had before the change (i.e. not yet synced). */
  staleQuantity: number;
  /** The item state to show until the server reflects the change. */
  optimistic: WishlistItemOutput;
}

/**
 * Returns a copy of the wishlist with one item replaced (matched by id).
 *
 * @param wishlist - The wishlist to update.
 * @param item - The new item state.
 * @returns A new wishlist object; other items keep their identity.
 */
export function replaceItem(
  wishlist: WishlistOutput,
  item: WishlistItemOutput,
): WishlistOutput {
  return {
    ...wishlist,
    items: wishlist.items.map((i) => (i.id === item.id ? item : i)),
  };
}

/**
 * Combines fresh server data with items still waiting for the server to sync.
 *
 * An entry is considered synced as soon as the server's `purchasedQuantity`
 * differs from `staleQuantity` (or the item is gone). Comparing against the stale
 * value, rather than expecting an exact number, also accepts concurrent purchases
 * by other guests: the server is the source of truth once it has moved.
 *
 * @param server - The wishlist as just returned by the server.
 * @param pending - Items currently shown optimistically.
 * @returns The wishlist to display and the entries that are still not synced.
 */
export function mergeServerWishlist(
  server: WishlistOutput,
  pending: readonly PendingItemSync[],
): { wishlist: WishlistOutput; pending: PendingItemSync[] } {
  const stillPending = pending.filter((entry) => {
    const serverItem = server.items.find((i) => i.id === entry.itemId);
    return serverItem?.purchasedQuantity === entry.staleQuantity;
  });

  const wishlist = stillPending.reduce(
    (acc, entry) => replaceItem(acc, entry.optimistic),
    server,
  );
  return { wishlist, pending: stillPending };
}
