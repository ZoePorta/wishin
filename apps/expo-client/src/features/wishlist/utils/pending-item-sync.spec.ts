import { describe, it, expect } from "vitest";
import type { WishlistItemOutput, WishlistOutput } from "@wishin/domain";
import {
  mergeServerWishlist,
  replaceItem,
  type PendingItemSync,
} from "./pending-item-sync";

const makeItem = (
  overrides: Partial<WishlistItemOutput> = {},
): WishlistItemOutput =>
  ({
    id: "item-1",
    name: "Lego",
    priority: 2,
    totalQuantity: 4,
    reservedQuantity: 0,
    purchasedQuantity: 0,
    availableQuantity: 4,
    isUnlimited: false,
    ...overrides,
  }) as WishlistItemOutput;

const makeWishlist = (items: WishlistItemOutput[]): WishlistOutput =>
  ({
    id: "wl-1",
    title: "Birthday",
    ownerId: "owner-1",
    items,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  }) as WishlistOutput;

const bought = makeItem({ purchasedQuantity: 1, availableQuantity: 3 });
const pendingPurchase: PendingItemSync = {
  itemId: "item-1",
  staleQuantity: 0,
  optimistic: bought,
};

describe("replaceItem", () => {
  it("replaces the matching item and leaves the rest untouched", () => {
    const other = makeItem({ id: "item-2" });
    const result = replaceItem(makeWishlist([makeItem(), other]), bought);
    expect(result.items[0]).toBe(bought);
    expect(result.items[1]).toBe(other);
  });
});

describe("mergeServerWishlist", () => {
  it("keeps the optimistic item while the server still has the stale value", () => {
    const server = makeWishlist([makeItem()]);
    const { wishlist, pending } = mergeServerWishlist(server, [
      pendingPurchase,
    ]);
    expect(wishlist.items[0]).toBe(bought);
    expect(pending).toEqual([pendingPurchase]);
  });

  it("uses the server item once it has changed, and drops the pending entry", () => {
    const synced = makeItem({ purchasedQuantity: 1, availableQuantity: 3 });
    const { wishlist, pending } = mergeServerWishlist(makeWishlist([synced]), [
      pendingPurchase,
    ]);
    expect(wishlist.items[0]).toBe(synced);
    expect(pending).toEqual([]);
  });

  it("trusts the server when it moved past the optimistic value (concurrent buyers)", () => {
    const moreBought = makeItem({ purchasedQuantity: 2, availableQuantity: 2 });
    const { wishlist, pending } = mergeServerWishlist(
      makeWishlist([moreBought]),
      [pendingPurchase],
    );
    expect(wishlist.items[0]).toBe(moreBought);
    expect(pending).toEqual([]);
  });

  it("drops the pending entry when the item no longer exists", () => {
    const { wishlist, pending } = mergeServerWishlist(makeWishlist([]), [
      pendingPurchase,
    ]);
    expect(wishlist.items).toEqual([]);
    expect(pending).toEqual([]);
  });

  it("returns the server wishlist unchanged when nothing is pending", () => {
    const server = makeWishlist([makeItem()]);
    expect(mergeServerWishlist(server, []).wishlist).toBe(server);
  });
});
