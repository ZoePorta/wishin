# Transaction Aggregate

## Description

The `Transaction` aggregate represents a solitary unit of work tracking the reservation or purchase of a specific `WishlistItem`. It serves as the immutable record of "who reserved what and when".

While the `WishlistItem` aggregate manages the total inventory counts (availability), `Transaction` manages the individual records that justify those counts. It handles the lifecycle of the action (Reserved -> Purchased -> Cancelled) and enforces strict identity rules (Guest vs User).

## Validation

**Validation is strict for all operations.**

Unlike other entities where business rules might evolve (e.g., username length), `Transaction` invariants are fundamental and expected to be constant. Therefore, both creation and reconstitution enforce the same strict validity rules.

### Rules (Always Enforced)

- **Structural**:
  - `id`, `itemId`: Must be valid UUID v4.
  - `quantity`: Must be a number.
  - `status`: Must be a valid enum value (`RESERVED`, `PURCHASED`, `CANCELLED`).
  - `createdAt`, `updatedAt`: Must be valid Date objects.

- **Business**:
  - `quantity`: Must be a positive integer (> 0).
  - `Identity Mandate`: Must have a `userId` defined.
  - `userId`: Must be a non-empty string. If starting with a UUID v4 format, it is prioritized. Required for all states. Can be null if the user was deleted (persistence).
  - `itemId`: Must be a valid UUID v4 if present. Can be null if the item was deleted (persistence).

## Attributes

| Attribute   | Type                         | Description                           | validation           |
| :---------- | :--------------------------- | :------------------------------------ | :------------------- |
| `id`        | `string` (UUID v4)           | Unique identifier                     | UUID v4              |
| `itemId`    | `string` (UUID v4) \| `null` | The item being transacted             | UUID v4 if present   |
| `userId`    | `string` \| `null`           | The user ID (Registered or Anonymous) | Non-empty if present |
| `status`    | `TransactionStatus`          | RESERVED, PURCHASED, CANCELLED        | Valid enum           |
| `quantity`  | `number`                     | Amount of items                       | Integer > 0          |
| `createdAt` | `Date`                       | Timestamp of creation                 | Valid Date           |
| `updatedAt` | `Date`                       | Timestamp of last update              | Valid Date           |

## Domain Invariants

1. **Immutability:** The transaction record is immutable. Core attributes (`itemId`, `quantity`, actors) never change. Any evolution of the `status` MUST result in a **new immutable instance** with the updated state.
2. **Identity Mandate:** A transaction MUST belong to a User (either registered or anonymous).
3. **Irreversibility of Creation:** Once created, a transaction allows the `WishlistItem` to decrement stock.
4. **Lifecycle Transitions:**
   - A transaction can move from `RESERVED` to `PURCHASED`.
   - A transaction can move from `RESERVED` or `PURCHASED` to `CANCELLED`.
   - It cannot go back to `RESERVED` once it is `PURCHASED` or `CANCELLED`.

## Operations (Behaviors)

### `createReservation(props: TransactionCreateReservationProps)`

- **Effect:** Initializes a new Transaction in `RESERVED` state.
- **Validation:** Enforces **STRICT** validation.
- **Behavior:**
  - Validates that `userId` is present.
  - Delegates to a **private static `create()`** method for common initialization.
- **Returns:** The created `Transaction` or throws `InvalidAttributeError`.

### `createPurchase(props: TransactionCreatePurchaseProps)`

- **Effect:** Initializes a new Transaction in `PURCHASED` state.
- **Validation:** Enforces **STRICT** validation.
- **Behavior:**
  - Requires `userId`.
  - Delegates to a **private static `create()`** method for common initialization.
- **Returns:** The created `Transaction` or throws `InvalidAttributeError`.

### `reconstitute(props: TransactionProps)`

- **Effect:** Recreates an instance from persistence.
- **Validation:** Enforces **STRUCTURAL** validation.
- **Behavior:**
  - Restores all properties exactly as they are.
  - Verifies that `createdAt` and `updatedAt` are valid.
  - Allows `itemId` and `userId` to be null (handling deleted references).
- **Returns:** `Transaction` instance or throws `InvalidAttributeError`.

### `cancel()`

- **Effect:** Marks the transaction as cancelled.
- **Validation:** checks that current status is NOT `CANCELLED`.
- **Behavior:**
  - Transitions `status` to `CANCELLED`.
  - Updates `updatedAt` to current date.
  - Throws `InvalidTransitionError` if already cancelled.
  - **Permission Rule**: A transaction can only be cancelled by the user (`userId`) who created it. This applies to both anonymous and registered sessions.
- **Returns:** New `Transaction` instance with updated status.

### `confirmPurchase()`

- **Effect:** Confirms a reservation as a purchase.
- **Validation:** checks that current status is `RESERVED`.
- **Behavior:**
  - Transitions `status` to `PURCHASED`.
  - Updates `updatedAt` to current date.
  - Throws `InvalidTransitionError` if not in `RESERVED` status.
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
