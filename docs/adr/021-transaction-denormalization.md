# ADR 021: Transaction Denormalization for Efficient Reads

## Status

Proposed

## Context

The application needs to display transaction history, including the name and price of the item, and the username of the item's owner. In the current normalized structure:

1. `Transaction` links to `WishlistItem` via `itemId`.
2. `WishlistItem` links to `Wishlist` via `wishlistId`.
3. `Wishlist` links to `Profile` via `ownerId`.

Reading a list of transactions would require multiple joins or sequential requests per item, which is inefficient in Appwrite (NoSQL) and leads to N+1 query problems on the client side.

## Decision

We will **denormalize** key item and owner metadata directly into the `Transaction` entity at the moment of creation.

The `Transaction` entity will now include:

- `itemName`: The name of the item at the time of transaction.
- `itemPrice`: The price of the item at the time of transaction.
- `itemCurrency`: The currency of the item price.
- `itemDescription`: The description of the item.
- `ownerUsername`: The username of the wishlist owner.

## Consequences

### Positive

- **Efficiency**: Transactions can be listed in a single query with all necessary display data.
- **Data Integrity (Snapshot)**: Transactions reflect the state of the item at the time they occurred (e.g., if an item's price changes later, the past transaction still shows the price when the reservation/purchase happened).
- **Simplicity**: Reducers and UI components don't need to perform complex lookups.

### Negative

- **Storage**: Slightly increased storage per transaction document.
- **Redundancy**: Data is duplicated across many transaction records.
- **Syncing**: If an item name changes, existing transactions will still show the old name. This is acceptable as transactions are considered "snapshots" in time (ADR 017).
