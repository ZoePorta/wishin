# ADR 012: Wishlist Aggregate Encapsulation

## Status

Accepted

## Context

Currently, `WishlistItem` encapsulates its own logic, but strict DDD principles suggest the Aggregate Root (`Wishlist`) should mediate all access to its components. This amends [ADR 006](006-domain-modeling-patterns.md) by enforcing strict encapsulation. Furthermore, moving items between wishlists involves two distinct aggregates and should be orchestrated by a Repository or Domain Service, rather than the item simply changing its parent ID in memory.

## Decision

We will enforce strict encapsulation where `Wishlist` acts as a **Proxy** for its items.

### 1. Proxy Methods (Wishlist)

The `Wishlist` aggregate will expose methods that delegate directly to `WishlistItem` methods:

- `updateItem(itemId, props)` -> calls `item.update(props)`
- `reserveItem(itemId, amount)` -> calls `item.reserve(amount)`
- `purchaseItem(itemId, amount, consumeFromReserved)` -> calls `item.purchase(...)`
- `cancelItemReservation(itemId, amount)` -> calls `item.cancelReservation(amount)`
- `cancelItemPurchase(itemId, amount)` -> calls `item.cancelPurchase(amount)`

These methods will:

1.  Find the item using `item.id`.
2.  Call the method on the item instance (which returns a NEW item instance).
3.  Replace the old item with the new one in the `items` list.
4.  Return the new `Wishlist` instance.

### 2. Item Lifecycle Management

- **`addItem(item)`**: Will use `item.equals(other)` to prevent duplicates. **Claims Ownership**: Updates `item.wishlistId` to `this.id`.
- **`removeItem(itemId)`**: Will find the item using `equals` (or ID match if simplified, but goal is object equality check context).
  - **Crucial**: It must return the removed item instance to allow the caller (Repo) to handle it (e.g., move it to another list).
  - Return type: `{ wishlist: Wishlist, removedItem: WishlistItem }`.

### 3. Reconstitution

- `Wishlist.reconstitute` will iterate over its raw item data and call `WishlistItem.reconstitute` for each, ensuring all internal objects are valid entities.

### 4. Moving Items (Repository Responsibility)

- Moving an item from Wishlist A to Wishlist B is a repository-level operation:
  1.  Remove item from A (getting the item instance).
  2.  Update item's `wishlistId` (via `updateWishlistId`).
  3.  Add item to B.
  4.  Save A and B.
- **WishlistItem Change**: Rename `moveToWishlist` to `updateWishlistId`. If the new ID matches the current ID, it returns `this` (no-op) instead of throwing.

## Consequences

- **Pros:**
  - Explicit aggregate boundaries.
  - Simplifies specialized logic like "move item" by exposing the necessary parts (removed item).
  - Prevents duplicate items.
  - Robust reconstitution.
- **Cons:**
  - More boilerplate in `Wishlist`.
  - `removeItem` signature is more complex than standard "return new aggregate".
