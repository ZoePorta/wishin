# Transaction Aggregate

## Description

The `Transaction` aggregate represents a solitary unit of work tracking the reservation or purchase of a specific `WishlistItem`. It serves as the immutable record of "who reserved what and when".

While the `WishlistItem` aggregate manages the total inventory counts (availability), `Transaction` manages the individual records that justify those counts. It handles the lifecycle of the action (Active -> Cancelled) and enforces strict identity rules (Guest vs User).

## Validation

**Validation is strict for all operations.**

Unlike other entities where business rules might evolve (e.g., username length), `Transaction` invariants are fundamental and expected to be constant. Therefore, both creation and reconstitution enforce the same strict validity rules.

### Rules (Always Enforced)

- **Structural**:
  - `id`, `itemId`: Must be valid UUID v4.
  - `quantity`: Must be a number.
  - `type` and `status`: Must be valid enum values.
  - `createdAt`, `updatedAt`: Must be valid Date objects.

- **Business**:
  - `quantity`: Must be a positive integer (> 0).
  - `Identity XOR`: Must have exactly ONE of `userId` or `guestSessionId` defined. Never both, never neither.
  - `userId`: If present, must be a valid UUID v4.
  - `guestSessionId`: If present, must be a non-empty string.

## Attributes

| Attribute        | Type                | Description                  | validation           |
| :--------------- | :------------------ | :--------------------------- | :------------------- |
| `id`             | `string` (UUID v4)  | Unique identifier            | UUID v4              |
| `itemId`         | `string` (UUID v4)  | The item being transacted    | UUID v4              |
| `userId`         | `string` (UUID v4)  | The registered user (if any) | UUID v4 if present   |
| `guestSessionId` | `string`            | The guest session (if any)   | Non-empty if present |
| `type`           | `TransactionType`   | RESERVATION or PURCHASE      | Valid enum           |
| `status`         | `TransactionStatus` | ACTIVE or CANCELLED          | Valid enum           |
| `quantity`       | `number`            | Amount of items              | Integer > 0          |
| `createdAt`      | `Date`              | Timestamp of creation        | Valid Date           |
| `updatedAt`      | `Date`              | Timestamp of last update     | Valid Date           |

## Domain Invariants

1. **Immutability:** The transaction record is immutable. Status changes (cancelling) result in a new instance (conceptually) or state transition within the aggregate lifecycle, but core attributes (`itemId`, `quantity`, `type`, actors) never change.
2. **Identity XOR:** A transaction belongs to EITHER a User OR a Guest. It cannot belong to both.
3. **Irreversibility of Creation:** Once created, a transaction allows the `WishlistItem` to decrement stock.
4. **Cancellation:** A transaction can only move from `ACTIVE` to `CANCELLED`. It cannot go back to `ACTIVE`.

## Operations (Behaviors)

### `create(props: TransactionCreateProps)`

- **Effect:** Initializes a new Transaction domain aggregate.
- **Validation:** Enforces **STRICT** validation.
- **Behavior:**
  - Generates a new `id` (UUID v4).
  - Sets `status` to `ACTIVE`.
  - Sets `createdAt` to current date if not provided.
  - Sets `updatedAt` to `createdAt`.
  - Validates that `userId` and `guestSessionId` are mutually exclusive.
- **Returns:** The created `Transaction` or throws `InvalidAttributeError`.

### `reconstitute(props: TransactionProps)`

- **Effect:** Recreates an instance from persistence.
- **Validation:** Enforces **STRICT** validation.
- **Behavior:**
  - Restores all properties exactly as they are.
  - Verifies that `createdAt` and `updatedAt` are valid.
- **Returns:** `Transaction` instance or throws `InvalidAttributeError`.

### `cancel()`

- **Effect:** Marks the transaction as cancelled.
- **Validation:** checks that current status is `ACTIVE`.
- **Behavior:**
  - Transitions `status` to `CANCELLED`.
  - Updates `updatedAt` to current date.
  - Throws `InvalidTransitionError` if already cancelled.
- **Returns:** New `Transaction` instance with updated status.

### `equals(other: Transaction)`

- **Effect:** Compares this entity with another `Transaction`.
- **Logic:** Returns `true` if `this.id === other.id`, otherwise `false`.
- **Returns:** `boolean`.

### `toProps()`

- **Effect:** Returns a shallow copy of the internal state.
- **Returns:** `TransactionProps` object.

## Domain Errors

- `InvalidAttributeError`: Thrown when validation rules are violated.
- `InvalidTransitionError`: Thrown when attempting to cancel an already cancelled transaction.
