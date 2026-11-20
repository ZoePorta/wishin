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

1. **Optimistic state comes from the domain.** `PurchaseItemUseCase` already returns the post-purchase wishlist, computed and validated by the `Wishlist` aggregate (`PurchaseItemOutput.wishlist`). The UI applies that item as is and never computes quantities itself. For an undo, the UI restores the item snapshot it had before the purchase. Again, no quantities are computed in the UI.
2. **Pending entries.** `useWishlist.applyOptimisticItem(next, previous)` replaces the item on screen and records a pending entry: the item id, the optimistic item, and the stale `purchasedQuantity` the server still has (`previous.purchasedQuantity`).
3. **"Synced" means "the server value has moved".** An entry is considered synced as soon as the server's `purchasedQuantity` for that item **differs from the stale value**, or the item no longer exists. The check does not wait for an exact number, so concurrent purchases by other guests are accepted: once the server has moved, its value wins.
4. **Stale responses never overwrite optimistic items.** Every server response goes through `mergeServerWishlist()` (`features/wishlist/utils/pending-item-sync.ts`), including the initial load, retries, pull-to-refresh and background polls. The merge keeps the optimistic version of every item that is still pending and takes everything else from the server.
5. **Background polling with backoff.** While entries are pending, the hook re-fetches after 0.4, 0.8, 1.2, 2, 3 and 5 s (≈ 12 s in total) and stops as soon as nothing is pending. A failed attempt is logged and the next attempt runs normally. A new optimistic update restarts the schedule. Polling does not show the pull-to-refresh indicator.
6. **The server always wins in the end.** If the server never catches up, after the last attempt the pending entries are dropped and the last server response is shown as is.
7. **Lifecycle.** Polling is cancelled and pending entries are cleared when the wishlist id changes or the screen unmounts. An undo can run after its card has unmounted (from the toast, once the last unit was bought and the card disappeared), because the screen owns the state.

## Consequences

### Positive

- Purchases and undos show up instantly on every platform, whatever the function's latency.
- The UI does not depend on how long the function takes, so the bug no longer comes and goes with timing.
- No quantity logic is duplicated in the UI: the optimistic state is the domain's own output.
- The server remains the source of truth, and the screen converges on its data within about 12 s at most.

### Negative / Limitations

- **This is a stop-gap until Realtime exists.** Polling only runs after the **current user's** actions. Purchases made by other guests, or changes made by the owner, are still not pushed to open screens. They appear only after a pull-to-refresh or a reload.
- **Polling costs extra requests.** A purchase triggers up to 6 extra reads of the whole wishlist (usually 1 or 2).
- **The optimistic state can be briefly wrong.** If the function fails or takes longer than about 12 s, the screen first shows the optimistic value and then reverts to the server value. The guest's purchase itself is not lost: it is the persisted transaction.
- **The sync heuristic only looks at `purchasedQuantity`.** Other fields edited by the owner meanwhile can be hidden by the optimistic item until it syncs. Reserved quantities are not covered either (reservations are deferred, [ADR 025](025-defer-reservations-post-mvp.md)).
- **Only the public wishlist screen does this.** The owner dashboard does not purchase items, and after its own CRUD actions it still performs a full re-fetch.

### Follow-up

Replace the polling with an **Appwrite Realtime** subscription to the wishlist's items (roadmap: "Appwrite Realtime"). Once the client receives item updates, `mergeServerWishlist()` can still apply them while an optimistic entry is pending, and the poll schedule (`SYNC_DELAYS_MS` in `useWishlist`) can be removed.
