# ADR 032: Optimistic Item Sync After Purchase

## Status

Accepted (2026-11-20)

Related: [ADR 028](028-accelerate-appwrite-functions.md). It handles the "Consistency Latency" consequence of ADR 028 on the client and does not change that decision.

## Context

Since [ADR 028](028-accelerate-appwrite-functions.md), `PurchaseItemUseCase` and `UndoPurchaseUseCase` only create or delete a `Transaction`. The item's `purchasedQuantity` is written **asynchronously** by the `sync-item-stats` Appwrite Function, which is triggered by the transaction's create/delete event. Guests have no write access to `WishlistItems`, so the client cannot update the item itself.

ADR 028 estimated the latency at under 500 ms and suggested re-fetching the wishlist. In practice:

- **A re-fetch right after the purchase reads stale data.** The request often reaches the database before the function has finished, so an item showing "×4" still shows "×4" after buying one. The new value only appears after a manual reload.
- **The latency varies a lot.** It depends on whether the function is warm. A cold start takes several seconds. The bug therefore appeared and disappeared depending on timing (for example, the first purchase after a page reload usually failed), which made it look platform-specific.
- **The client has no Realtime subscription yet** (see the roadmap item "Appwrite Realtime"), so it is never told when the function finishes.

The guest must see the result of their own action immediately, and the screen must end up showing the server's data.

## Decision

After a successful purchase or undo, the public wishlist screen **shows the expected item state immediately and then reconciles it with the server in the background**.

1. **The UI reports changes, the domain computes quantities.** After a purchase or undo the UI only reports the net change (`+1`, `-1`) to `useWishlist.applyOptimisticChange()`. The displayed item is the server's item passed through the domain's `projectPurchasedQuantity()`, which also derives availability. Stock validation stays in the use cases. No item snapshots are kept or restored, so an undo never brings back quantities that other guests have changed since.
2. **Pending entries.** Each item with unsynced changes has one entry: the **baseline** (the `purchasedQuantity` the server had before the first unsynced change) and the **delta** (the net units of all unsynced changes). The displayed quantity is `baseline + delta`.
   - For a purchase, the baseline is the quantity `PurchaseItemUseCase` read from the server (`PurchaseItemOutput.previousPurchasedQuantity`), not the one on the card, which may be older.
   - For an undo, it is the last quantity received from the server.
   - Further changes to an item that is still pending add to its delta and **keep the original baseline**.
3. **"Synced" means "the server reflects the net change".** An entry with a positive delta is dropped once the server's `purchasedQuantity` is **at least** `baseline + delta`; with a negative delta, once it is **at most** that; and in any case if the item no longer exists. The check does not wait for an exact number, so concurrent purchases by other guests are accepted. With a net delta of zero (a purchase undone before it synced) quantity alone cannot tell "not started" from "done", so the entry is held until polling ends.
4. **Stale responses never overwrite newer data.** Every server response (initial load, retries, pull-to-refresh and background polls) goes through one `WishlistSync` (`features/wishlist/utils/pending-item-sync.ts`). It numbers requests when they are sent and discards a response if one requested later has already been applied. For pending items it replaces only the quantities; everything else comes from the server.
5. **Background polling with backoff.** While entries are pending, the hook re-fetches after 0.4, 0.8, 1.2, 2, 3 and 5 s (≈ 12 s in total) and stops as soon as nothing is pending. A failed attempt is logged and the next attempt runs normally. A new optimistic update restarts the schedule. Polling does not show the pull-to-refresh indicator.
6. **The server always wins in the end.** If the server never catches up, after the last attempt the pending entries are dropped and the newest accepted server response is shown as is.
7. **Lifecycle.** Polling is cancelled and pending entries are cleared when the wishlist id changes or the screen unmounts. An undo can run after its card has unmounted (from the toast, once the last unit was bought and the card disappeared), because the screen owns the state.

## Consequences

### Positive

- Purchases and undos show up instantly on every platform, whatever the function's latency.
- The UI does not depend on how long the function takes, so the bug no longer comes and goes with timing.
- No quantity logic is duplicated in the UI: the optimistic state is a domain projection.
- The server remains the source of truth, and the screen converges on its data within about 12 s at most.

### Negative / Limitations

- **This is a stop-gap until Realtime exists.** Polling only runs after the **current user's** actions. Purchases made by other guests, or changes made by the owner, are still not pushed to open screens. They appear only after a pull-to-refresh or a reload.
- **Polling costs extra requests.** A purchase triggers up to 6 extra reads of the whole wishlist (usually 1 or 2).
- **The optimistic state can be briefly wrong.** If the function fails or takes longer than about 12 s, the screen first shows the optimistic value and then reverts to the server value. The guest's purchase itself is not lost: it is the persisted transaction.
- **The sync heuristic only looks at `purchasedQuantity`.** It cannot tell whose change moved the quantity. A concurrent purchase can make a purchase look synced slightly early, or keep an undo pending until polling ends. In the first case the displayed quantity can stay low until the next refresh; in the second it is corrected within about 12 s. Purchases are always validated against the server. Reserved quantities are not covered (reservations are deferred, [ADR 025](025-defer-reservations-post-mvp.md)).
- **Only the public wishlist screen does this.** The owner dashboard does not purchase items, and after its own CRUD actions it still performs a full re-fetch.

### Follow-up

Replace the polling with an **Appwrite Realtime** subscription to the wishlist's items (roadmap: "Appwrite Realtime"). Once the client receives item updates, `WishlistSync` can still apply them while an optimistic entry is pending, and the poll schedule (`SYNC_DELAYS_MS` in `useWishlist`) can be removed.
