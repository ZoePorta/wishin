# ADR 025: Deferring Reservation Feature for Post-MVP

## Status

Accepted (2026-03-09)
Amended by [ADR 028](file:///home/zoe/Documents/wishin/docs/adr/028-accelerate-appwrite-functions.md) (2026-03-16)

Accepted after implementation was merged and validated as part of the MVP consolidation.

## Context

The initial design included a dual flow for wishlist interactions: Direct Purchase and Reservation. Implementing a robust "Smart Consumption" logic that merges these flows (FIFO consumption, consolidation, etc.) as described in [ADR 024](file:///home/zoe/Documents/wishin/docs/adr/024-smart-purchase-consumption.md) has introduced significant complexity in the Use Case layer. This decision pauses the implementation described in ADR 024 (Smart Purchase Consumption) for post-MVP. Additionally, the UI/UX requirements for managing and notifying users about existing reservations add further friction to the MVP development.

## Decision

We will **defer the Reservation feature** for post-MVP. The primary focus for the first release will be the **Direct Purchase** flow.

### Implementation adjustments:

- `ReserveItemUseCase`: Remains in the codebase but will not be called by the UI. It is marked as deferred.
- `PurchaseItemUseCase`: Simplified to handle only direct purchases. It will no longer check for or consume existing reservation transactions.
- `WishlistItem`: The `reservedQuantity` counter remains in the schema but will be initialized to 0 and not updated during the MVP phase.
- `PublicItemCard` (UI): References to "RESERVED" badges or overlays will be removed to avoid user confusion.

## Consequences

### Positive

- **Reduced Complexity**: Significant simplification of the `PurchaseItemUseCase` and its associated tests.
- **Faster MVP Delivery**: Removes the need to implement complex reservation mutation UI (confirm/cancel/update).
- **Clearer UX**: Users have a single, direct path to gifting.

### Negative

- **Temporary Lack of "Soft" Commitments**: Users cannot "lock" an item without buying it immediately.
- **Legacy Debt**: The `reservedQuantity` fields and `RESERVED` transaction status remain in the codebase as "ghost" features until fully restored.
