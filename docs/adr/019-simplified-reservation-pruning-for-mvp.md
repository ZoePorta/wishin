# ADR 019: Simplified Reservation Pruning for MVP

## Status

Accepted
Amends [ADR 012](./012-wishlist-aggregate-encapsulation.md) (Inventory Management)
Amends [ADR 013](./013-unified-transaction-state-model.md) (Transaction Statuses)

## Context

The `WishlistItem` entity was initially designed with selective pruning logic that attempted to keep as many reservations as possible when `totalQuantity` was reduced. However, this introduced several complexities for the MVP:

1.  **Complexity**: Logic to decide which reservations to keep (e.g., first-come-first-served vs. random).
2.  **Traceability**: Difficulty in explaining to users why some reservations were kept and others were not.
3.  **Notification Overhead**: Requirement for a targeted notification system to inform only a subset of contributors.

## Decision

To streamline the MVP development and ensure predictable behavior, we have decided to simplify the reservation pruning logic:

1.  **Mass Cancellation**: When an owner reduces the `totalQuantity` of an item such that the new total is less than the current commitment (`reservedQuantity + purchasedQuantity`), **ALL** existing reservations for that item will be cancelled.
2.  **Explicit Status**: We will add a new state `CANCELLED_BY_OWNER` to the `TransactionStatus` enum (replacing the generic `CANCELLED` for this specific flow) to provide an audit trail for system-initiated revocations.
3.  **Ownership**: The `UpdateWishlistItemUseCase` will be responsible for:
    - Identifying if pruning is required.
    - Triggering the cancellation of all associated `RESERVED` transactions.
    - Resetting the `reservedQuantity` on the `WishlistItem` to `0`.
4.  **Automatic Notifications**: No code is required in the application or domain layers for notifications. The actual delivery will be handled by **Appwrite Functions** triggered directly by the database whenever a transaction status changes to `CANCELLED_BY_OWNER`. This ensures the notification flow is decoupled and purely infrastructure-driven.

## Consequences

### Positive

- **Deterministic Behavior**: Both owners and contributors have clear expectations of what happens during item updates.
- **Implementation Speed**: Reduces the logic required in the domain and application layers.
- **Clear Audit Trail**: `CANCELLED_BY_OWNER` status clearly distinguishes these actions from manual cancellations.
- **Service Decoupling**: Offloading notifications to Appwrite Functions keeps the domain layer focused on business state transitions.

### Negative

- **Contributor Friction**: Users whose reservations could have been preserved may be frustrated by the "all-or-nothing" approach. This will be addressed in post-MVP iterations with selective pruning logic.
