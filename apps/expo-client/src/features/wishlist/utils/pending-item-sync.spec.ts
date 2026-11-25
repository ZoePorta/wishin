import { describe, it, expect } from "vitest";
import type { WishlistItemOutput, WishlistOutput } from "@wishin/domain";
import {
  addPendingChange,
  mergeServerWishlist,
  WishlistSync,
  type PendingItemSync,
} from "./pending-item-sync";

const makeItem = (
  purchasedQuantity = 0,
  overrides: Partial<WishlistItemOutput> = {},
): WishlistItemOutput =>
  ({
    id: "item-1",
    name: "Lego",
    priority: 2,
    totalQuantity: 4,
    reservedQuantity: 0,
    purchasedQuantity,
    availableQuantity: 4 - purchasedQuantity,
    isUnlimited: false,
    ...overrides,
  }) as WishlistItemOutput;

const makeWishlist = (...items: WishlistItemOutput[]): WishlistOutput =>
  ({
    id: "wl-1",
    title: "Birthday",
    ownerId: "owner-1",
    items,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  }) as WishlistOutput;

const entry = (baselineQuantity: number, delta: number): PendingItemSync => ({
  itemId: "item-1",
  baselineQuantity,
  delta,
});

/** Purchased quantity of `item-1` in a wishlist. */
const purchased = (wishlist: WishlistOutput | null) =>
  wishlist?.items.find((i) => i.id === "item-1")?.purchasedQuantity;

describe("mergeServerWishlist", () => {
  it("shows the expected quantity while the server has not caught up", () => {
    const result = mergeServerWishlist(makeWishlist(makeItem(0)), [
      entry(0, 1),
    ]);
    expect(result.wishlist.items[0]).toEqual(makeItem(1));
    expect(result.pending).toEqual([entry(0, 1)]);
  });

  it("uses the server item once it reflects a purchase", () => {
    const synced = makeItem(1);
    const result = mergeServerWishlist(makeWishlist(synced), [entry(0, 1)]);
    expect(result.wishlist.items[0]).toBe(synced);
    expect(result.pending).toEqual([]);
  });

  it("uses the server item once it reflects an undo", () => {
    const synced = makeItem(1);
    const result = mergeServerWishlist(makeWishlist(synced), [entry(2, -1)]);
    expect(result.wishlist.items[0]).toBe(synced);
    expect(result.pending).toEqual([]);
  });

  it("keeps an undo pending while the server still has the old quantity", () => {
    const result = mergeServerWishlist(makeWishlist(makeItem(2)), [
      entry(2, -1),
    ]);
    expect(purchased(result.wishlist)).toBe(1);
    expect(result.pending).toHaveLength(1);
  });

  it("trusts the server when concurrent buyers moved it further", () => {
    const result = mergeServerWishlist(makeWishlist(makeItem(3)), [
      entry(0, 1),
    ]);
    expect(purchased(result.wishlist)).toBe(3);
    expect(result.pending).toEqual([]);
  });

  it("does not regress when a poll only reflects another buyer's earlier purchase", () => {
    // The card showed 0, but the use case read 1 from the server and bought one more.
    const result = mergeServerWishlist(makeWishlist(makeItem(1)), [
      entry(1, 1),
    ]);
    expect(purchased(result.wishlist)).toBe(2);
    expect(result.pending).toHaveLength(1);
  });

  it("stays pending until the server reflects every unsynced purchase", () => {
    const pending = [entry(0, 2)];
    for (const serverQuantity of [0, 1]) {
      const result = mergeServerWishlist(
        makeWishlist(makeItem(serverQuantity)),
        pending,
      );
      expect(purchased(result.wishlist)).toBe(2);
      expect(result.pending).toEqual(pending);
    }
    expect(
      mergeServerWishlist(makeWishlist(makeItem(2)), pending).pending,
    ).toEqual([]);
  });

  it("holds the baseline when an unsynced purchase was undone", () => {
    for (const serverQuantity of [0, 1]) {
      const result = mergeServerWishlist(
        makeWishlist(makeItem(serverQuantity)),
        [entry(0, 0)],
      );
      expect(purchased(result.wishlist)).toBe(0);
      expect(result.pending).toHaveLength(1);
    }
  });

  it("shows other fields from the server while an item is pending", () => {
    const edited = makeItem(0, { name: "Renamed", totalQuantity: 6 });
    const { wishlist } = mergeServerWishlist(makeWishlist(edited), [
      entry(0, 1),
    ]);
    expect(wishlist.items[0]).toMatchObject({
      name: "Renamed",
      purchasedQuantity: 1,
      availableQuantity: 5,
    });
  });

  it("drops the pending entry when the item no longer exists", () => {
    const result = mergeServerWishlist(makeWishlist(), [entry(0, 1)]);
    expect(result.wishlist.items).toEqual([]);
    expect(result.pending).toEqual([]);
  });

  it("leaves items without pending changes untouched", () => {
    const other = makeItem(0, { id: "item-2" });
    const result = mergeServerWishlist(makeWishlist(makeItem(0), other), [
      entry(0, 1),
    ]);
    expect(result.wishlist.items[1]).toBe(other);
  });

  it("returns the server wishlist unchanged when nothing is pending", () => {
    const server = makeWishlist(makeItem());
    expect(mergeServerWishlist(server, []).wishlist).toBe(server);
  });
});

describe("addPendingChange", () => {
  it("starts from the baseline read by the mutation, not the displayed value", () => {
    expect(
      addPendingChange(
        [],
        { itemId: "item-1", delta: 1, baselineQuantity: 1 },
        makeWishlist(makeItem(0)),
      ),
    ).toEqual([entry(1, 1)]);
  });

  it("falls back to the last server quantity when no baseline is given", () => {
    expect(
      addPendingChange(
        [],
        { itemId: "item-1", delta: -1 },
        makeWishlist(makeItem(2)),
      ),
    ).toEqual([entry(2, -1)]);
  });

  it("accumulates repeated changes on the original baseline", () => {
    expect(
      addPendingChange(
        [entry(0, 1)],
        { itemId: "item-1", delta: 1, baselineQuantity: 1 },
        makeWishlist(makeItem(0)),
      ),
    ).toEqual([entry(0, 2)]);
  });

  it("ignores changes to items the server does not have", () => {
    expect(
      addPendingChange([], { itemId: "gone", delta: -1 }, makeWishlist()),
    ).toEqual([]);
    // e.g. a purchase that resolves after the screen switched to another wishlist
    expect(
      addPendingChange(
        [],
        { itemId: "gone", delta: 1, baselineQuantity: 0 },
        makeWishlist(),
      ),
    ).toEqual([]);
    expect(
      addPendingChange(
        [],
        { itemId: "item-1", delta: 1, baselineQuantity: 0 },
        null,
      ),
    ).toEqual([]);
  });
});

describe("WishlistSync", () => {
  const start = (quantity = 0) => {
    const sync = new WishlistSync();
    sync.acceptResponse(sync.beginRequest(), makeWishlist(makeItem(quantity)));
    return sync;
  };
  const purchase = (baselineQuantity: number) => ({
    itemId: "item-1",
    delta: 1,
    baselineQuantity,
  });

  it("shows a recorded change immediately", () => {
    const sync = start();
    sync.record(purchase(0));
    expect(purchased(sync.displayed)).toBe(1);
    expect(sync.hasPending()).toBe(true);
  });

  it("subtracts an undo from the latest server quantity (concurrent buyer)", () => {
    const sync = start();
    sync.record(purchase(0));
    sync.acceptResponse(sync.beginRequest(), makeWishlist(makeItem(2)));
    sync.record({ itemId: "item-1", delta: -1 });
    expect(purchased(sync.displayed)).toBe(1);
  });

  it("discards a response older than one already applied", () => {
    const sync = start();
    const slowRefresh = sync.beginRequest();
    sync.record(purchase(0));
    expect(
      sync.acceptResponse(sync.beginRequest(), makeWishlist(makeItem(1))),
    ).toBe(true);
    expect(sync.hasPending()).toBe(false);

    expect(sync.isSuperseded(slowRefresh)).toBe(true);
    expect(sync.acceptResponse(slowRefresh, makeWishlist(makeItem(0)))).toBe(
      false,
    );
    expect(purchased(sync.displayed)).toBe(1);
  });

  it("keeps items pending when a stale response is discarded", () => {
    const sync = start();
    const slowPoll = sync.beginRequest();
    sync.record(purchase(0));
    sync.acceptResponse(sync.beginRequest(), makeWishlist(makeItem(0)));
    sync.acceptResponse(slowPoll, makeWishlist(makeItem(1)));
    expect(sync.hasPending()).toBe(true);
  });

  it("falls back to the newest accepted server data when pending changes are dropped", () => {
    const sync = start();
    sync.record(purchase(0));
    const slowPoll = sync.beginRequest();
    sync.acceptResponse(
      sync.beginRequest(),
      makeWishlist(makeItem(0, { name: "Newest" })),
    );
    sync.acceptResponse(slowPoll, makeWishlist(makeItem(0)));
    sync.dropPending();
    expect(sync.hasPending()).toBe(false);
    expect(sync.displayed?.items[0]).toEqual(makeItem(0, { name: "Newest" }));
  });

  it("discards responses requested before a reset", () => {
    const sync = start();
    const inFlight = sync.beginRequest();
    sync.record(purchase(0));
    sync.reset();
    expect(sync.displayed).toBeNull();
    expect(sync.hasPending()).toBe(false);
    expect(sync.acceptResponse(inFlight, makeWishlist(makeItem(1)))).toBe(
      false,
    );
  });
});
