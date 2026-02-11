# Transaction Aggregate

The `Transaction` aggregate represents a reservation or purchase of a `WishlistItem`. It manages the lifecycle of this action, including creation and cancellation, while ensuring that inventory implications are handled by the `WishlistItem` entity (though the transaction record itself is the source of truth for "who did what").

## Operations

### `create()`

Creates a new `Transaction` instance. Enforces STRICT validation rules.

- **Validation Mode**: `STRICT`
- **Invariants**:
  - `id`, `itemId`: Must be valid UUID v4.
  - `quantity`: Must be a positive integer.
  - `Actor Identity`: Must have exactly ONE of `userId` (for registered users) or `guestSessionId` (for guests).
- **Behavior**:
  - Initializes status to `ACTIVE`.
  - Sets `createdAt` to current date if not provided.

### `reconstitute()`

Reconstitutes a `Transaction` from persistence. Bypasses business validation.

- **Validation Mode**: `STRUCTURAL`
- **Invariants**:
  - Basic types and UUID format checks only.

### `cancel()`

Marks a transaction as cancelled.

- **Validation Mode**: `EVOLUTIVE`
- **Behavior**:
  - Transitions status from `ACTIVE` to `CANCELLED`.
  - Throws if already cancelled.
