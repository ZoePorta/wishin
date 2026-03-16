# ADR 028: Accelerate Appwrite Functions for Atomicity and Permission Resolution

## Status

Accepted (2026-03-16)

Supersedes [ADR 023](023-non-atomic-sequential-saves.md)
Amends [ADR 025](025-defer-reservations-post-mvp.md)

## Context

In [ADR 023](023-non-atomic-sequential-saves.md), we accepted non-atomic sequential saves in the Application Layer to speed up MVP development, deferring Appwrite Functions to Phase 6.

However, during implementation and testing of the guest purchase flow, a critical blocker was identified: **Guest users (anonymous sessions) do not have write permissions** on the `WishlistItems` collection for security reasons. Allowing direct client-side updates would expose the inventory to manipulation.

To resolve this without compromising security, we must move the item statistics update logic to the server side immediately.

## Decision

We will **accelerate the implementation of Appwrite Functions** (originally planned for Phase 6) to handle all mutations of item statistics (`purchasedQuantity` and `reservedQuantity`).

### Changes:

1.  **Server-Side Logic**: Appwrite Functions will trigger on `databases.*.collections.transactions.documents.*.create` and `.delete` events to update the corresponding item in the `WishlistItems` collection.
2.  **AppLayer Simplification**: Use cases (`PurchaseItemUseCase`, `ReserveItemUseCase`, `UndoPurchaseUseCase`) will no longer attempt to save the `Wishlist` aggregate. They will only persist the `Transaction`.
3.  **Atomic Consistency**: By using server-side functions, we move closer to atomic updates as the system-level execution of functions is more reliable and runs with elevated privileges.
4.  **Permission Safety**: Guest users only need create/delete permissions on the `Transactions` collection. They no longer require update permissions on `WishlistItems`.

## Consequences

### Positive

- **Security**: Minimal permissions granted to client-side sessions.
- **Reliability**: Eliminates the "partial success" state where a wishlist was updated but a transaction failed (or vice-versa) at the application layer.
- **Simpler Code**: Removes 50+ lines of complex compensating rollback logic from each use case.

### Negative

- **Infrastructure Dependency**: Local development now requires the Appwrite Function to be running or mocked for full integration testing.
- **Consistency Latency**: The item stats update is now eventually consistent (though typically < 500ms), meaning the client might need to re-fetch the wishlist to see the updated numbers if the Appwrite real-time subscription is not used.
