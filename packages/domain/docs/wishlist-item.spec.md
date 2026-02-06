# Domain Entity: WishlistItem

## Description

The `WishlistItem` is the core entity of the Wishin domain. It represents a gift item within a wishlist and manages its lifecycle through an atomic inventory system. This entity is **strictly immutable**.

## Validation Modes

The entity supports two validation modes to ensure data integrity while allowing legacy data or partial updates:

- **STRICT** (Create): Full validation. Enforces structural integrity, business rules (name length, etc.), and strict inventory invariants ($Q_{total} \ge Q_{reserved} + Q_{purchased}$).
- **EVOLUTIVE** (Update): Enforces structural integrity and business rules. Relaxes inventory invariants to allow valid over-commitment (Privacy).
- **TRANSACTION** (Reserve/Purchase): Enforces structural integrity and strict inventory invariants. Bypasses business rules (e.g., allows legacy short names) to prevent blocking guests.
- **RECONSTITUTE** (Hydration/Cancel): Enforces only structural integrity. Bypasses business rules and inventory checks to load legacy data or allow lenient cancellations.

### Structural Integrity (Always Enforced by All Modes)

- `id` and `wishlistId` must be valid UUIDs.
- `priority` must be a valid Enum value (1-4).
- `totalQuantity`, `reservedQuantity`, `purchasedQuantity` must be integers $\ge 0$ (total $\ge 1$).

### Business Rules (Enforced by STRICT & EVOLUTIVE)

- `name`: 3-100 chars.
- `description`: max 500 chars.
- `price`: $\ge 0$ if present.
- `url`/`imageUrl`: valid URLs.

### Inventory Invariants (Enforced by STRICT & TRANSACTION)

- $Q_{total} \ge Q_{reserved} + Q_{purchased}$ (unless unlimited).

## Attributes

| Attribute           | Type               | Description            | Constraints                                    |
| :------------------ | :----------------- | :--------------------- | :--------------------------------------------- |
| `id`                | `string` (UUID v4) | Unique identifier      | Required                                       |
| `wishlistId`        | `string` (UUID v4) | Parent wishlist ID     | Required                                       |
| `name`              | `string`           | Item name              | 3-100 chars, trimmed                           |
| `description`       | `string`           | Optional details       | Max 500 chars                                  |
| `priority`          | `Priority`         | Item urgency           | Numeric: LOW(1), MEDIUM(2), HIGH(3), URGENT(4) |
| `price`             | `number`           | Reference price        | Optional, must be $\ge 0$                      |
| `currency`          | `string`           | ISO currency code      | Required if price is set                       |
| `url`               | `string`           | Link to the product    | Optional, valid URL                            |
| `imageUrl`          | `string`           | Link to product image  | Optional, valid URL                            |
| `isUnlimited`       | `boolean`          | Bypass stock checks    | Default: `false`                               |
| `totalQuantity`     | `number`           | Total units desired    | Integer, $\ge 1$                               |
| `reservedQuantity`  | `number`           | Units currently locked | Integer, $\ge 0$                               |
| `purchasedQuantity` | `number`           | Units already bought   | Integer, $\ge 0$                               |

## Calculated Fields

- **Available Quantity ($Q_{available}$):**
  $$Q_{available} = \max(0, Q_{total} - (Q_{reserved} + Q_{purchased}))$$

## Domain Invariants

1. **Inventory Privacy:** The total quantity MAY be less than the sum of reserved and purchased units (e.g., if the owner reduces the desire count after items were bought). This preserves the surprise factor.
2. **Immutability:** Any state change must result in a new instance of `WishlistItem`.
3. **Strict Creation:** Creating a fresh item via `create()` adheres to **STRICT** mode.
4. **Relaxed Restoration:** Restoring an item via `reconstitute()` uses **RECONSTITUTE** mode. `update` uses **EVOLUTIVE** mode. `reserve`/`purchase` use **TRANSACTION** mode.

## Operations (Behaviors)

### `reconstitute(props: WishlistItemProps)`

- **Effect:** Creates an instance from persistence, bypassing strict inventory invariants.
- **Logic:** Allows restoring items where $Q_{total} < Q_{reserved} + Q_{purchased}$.
- **Returns:** `WishlistItem` instance.

### `update(props: Partial<WishlistItemProps>)`

- **Effect:** Modifies editable properties (name, description, priority, price, totalQuantity, etc.).
- **Restrictions:** Cannot modify `id`, `wishlistId`, `reservedQuantity`, or `purchasedQuantity` directly (throws `InvalidAttributeError`).
- **Logic:**
  - **Reservation Pruning:** If $Q_{total}$ is reduced, $Q_{reserved}$ is automatically pruned to $\min(Q_{reserved}, \max(0, Q_{newTotal} - Q_{purchased}))$.
  - Creates a new instance with merged properties.
  - Bypasses strict inventory check to allow "over-commitment" (privacy preservation).
- **Returns:** New instance with updated state.

### `reserve(amount: number)`

- **Effect:** Increases `reservedQuantity`.
- **Pre-condition:** `isUnlimited` is true OR `amount <= Q_{available}`.
- **Pre-condition:** `amount > 0`.
- **Enforces:** Strict stock validation.
- **Returns:** New instance with updated state.

### `moveToWishlist(newWishlistId: string)`

- **Effect:** Moves the item to a different wishlist.
- **Pre-condition:** `newWishlistId` must be a valid UUID v4.
- **Pre-condition:** `newWishlistId` must be different from current `wishlistId`.
- **Returns:** New instance with updated `wishlistId`.

### `cancelReservation(amount: number)`

- **Effect:** Decreases `reservedQuantity`.
- **Pre-condition:** `amount <= current reservedQuantity`.
- **Pre-condition:** `amount > 0`.
- **Mode:** **Lenient**. Allows operation even if the item remains over-committed (as it improves the state).
- **Returns:** New instance with updated state.

### `purchase(totalAmount: number, consumeFromReserved: number)`

- **Effect:** Increases `purchasedQuantity` by `totalAmount`.
- **Logic:**
  - Ensure `totalAmount > 0`.
  - Ensure `consumeFromReserved >= 0`.
  - Ensure `consumeFromReserved <= totalAmount`.
  - Ensure `consumeFromReserved <= current reservedQuantity`.
  - Ensure `(totalAmount - consumeFromReserved) <= Q_{available}` (unless `isUnlimited`).
  - Decreases `reservedQuantity` by `consumeFromReserved`.
- **Enforces:** Strict stock validation.
- **Returns:** New instance with updated state.

### `cancelPurchase(amountToCancel: number, amountToReserved: number)`

- **Effect:** Decreases `purchasedQuantity` and optionally increases `reservedQuantity`.
- **Pre-conditions:**
  - `amountToCancel > 0`.
  - `amountToReserved >= 0`.
  - `amountToCancel <= purchasedQuantity`.
  - `amountToReserved <= amountToCancel`.
- **Logic (2-Step):**
  1.  **Reduce Purchase:** Decreases `purchasedQuantity`. (Lenient: always allowed).
  2.  **Restock Reserve:** Increases `reservedQuantity` by `amountToReserved`. (Strict: fails if over-committed state prevents restocking).
- **Returns:** New instance with updated state.

### `equals(other: WishlistItem)`

- **Effect:** Compares this entity with another `WishlistItem`.
- **Logic:** Returns `true` if `this.id === other.id`, otherwise `false`.
- **Returns:** `boolean`

## Domain Errors

- `InvalidAttributeError`: Thrown on invalid name, price, or UUID format.
- `InsufficientStockError`: Thrown when an operation exceeds available or reserved units.
- `InvalidTransitionError`: Thrown when internal logic rules are violated (e.g., consuming more from reservation than total purchase).
