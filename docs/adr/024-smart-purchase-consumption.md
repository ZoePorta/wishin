# ADR 024: Smart Purchase Consumption and History Preservation

## Status

Proposed

## Context

Users can interact with wishlist items in two ways:

1. **Direct Purchase**: Buying an item immediately.
2. **Reservation**: Locking an item to buy it later.

In the original design, these flows were separate. This led to a risk of "duplicate commitments" (e.g., a user has 1 unit reserved but buys 1 unit directly, resulting in 2 units being removed from inventory if they forget about their reservation).

Furthermore, users expect their gifting history to be clean. If they bought something they had reserved 3 days ago, they usually want that purchase to reflect the original intent date.

## Decision

We will implement a unified **Smart Purchase** logic in the `PurchaseItemUseCase`.

### Smart Consumption Strategy

When a user performs a purchase for `requestedQuantity`, the system automatically looks for existing `RESERVED` transactions for that same user and item:

- **Case 1: requested >= reserved** (Total Consumption):
  - The oldest reservation is "promoted" to `PURCHASED`.
  - Its quantity is updated to the full `requestedQuantity`.
  - **Outcome**: A single purchase record that preserves the original reservation's `createdAt` timestamp.
  - _Any additional reservations (rare) are cancelled to clean up state._

- **Case 2: requested < reserved** (Partial Consumption):
  - A NEW `PURCHASED` transaction is created for the `requestedQuantity`.
  - The oldest reservation's quantity is reduced (shrunk).
  - **Outcome**: The user has their new purchase record and still maintains the remaining reservation.

### Domain Support

To support this without breaking immutability, the `Transaction` entity includes:

- `promoteToPurchase(newQuantity)`: Updates status and quantity in one step.
- `updateQuantity(newQuantity)`: Adjusts quantity while keeping other metadata and timestamps.

## Consequences

### Positive

- **Superior UX**: Prevents accidental inventory blocks and keeps gifting history coherent.
- **Simplicity**: The UI doesn't need to ask the user "Do you want to use your reservation?". It just works.
- **History Integrity**: Preserves the "intent date" for purchases that originated as reservations.

### Negative

- **Complexity**: The Use Case logic is more complex as it must coordinate multiple transaction updates.
- **Query Overhead**: Requires an extra read to finding existing reservations before proceeding.
