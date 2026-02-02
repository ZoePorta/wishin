# Domain Entity: WishlistItem

## Description

The `WishlistItem` is the core entity of the Wishin domain. it represents a gift item within a wishlist and manages its lifecycle through an atomic inventory system. This entity is **strictly immutable**.

## Attributes

| Attribute           | Type               | Description            | Constraints               |
| :------------------ | :----------------- | :--------------------- | :------------------------ |
| `id`                | `string` (UUID v4) | Unique identifier      | Required                  |
| `wishlistId`        | `string` (UUID v4) | Parent wishlist ID     | Required                  |
| `name`              | `string`           | Item name              | 3-100 chars, trimmed      |
| `description`       | `string`           | Optional details       | Max 500 chars             |
| `price`             | `number`           | Reference price        | Optional, must be $\ge 0$ |
| `currency`          | `string`           | ISO currency code      | Required if price is set  |
| `url`               | `string`           | Link to the product    | Optional, valid URL       |
| `imageUrl`          | `string`           | Link to product image  | Optional, valid URL       |
| `isUnlimited`       | `boolean`          | Bypass stock checks    | Default: `false`          |
| `totalQuantity`     | `number`           | Total units desired    | Integer, $\ge 1$          |
| `reservedQuantity`  | `number`           | Units currently locked | Integer, $\ge 0$          |
| `purchasedQuantity` | `number`           | Units already bought   | Integer, $\ge 0$          |

## Calculated Fields

- **Available Quantity ($Q_{available}$):**
  $$Q_{available} = Q_{total} - (Q_{reserved} + Q_{purchased})$$

## Domain Invariants

1. **Inventory Integrity:** Unless `isUnlimited` is true, the sum of reserved and purchased units must never exceed the total quantity:
   $$Q_{total} \ge (Q_{reserved} + Q_{purchased})$$
2. **Immutability:** Any state change must result in a new instance of `WishlistItem`.

## Operations (Behaviors)

### `reserve(amount: number)`

- **Effect:** Increases `reservedQuantity`.
- **Pre-condition:** `isUnlimited` is true OR `amount <= Q_{available}`.
- **Returns:** New instance with updated state.

### `cancelReservation(amount: number)`

- **Effect:** Decreases `reservedQuantity`.
- **Pre-condition:** `amount <= current reservedQuantity`.
- **Returns:** New instance with updated state.

### `purchase(totalAmount: number, consumeFromReserved: number)`

- **Effect:** Increases `purchasedQuantity` by `totalAmount`.
- **Logic:**
  - Validates `consumeFromReserved <= totalAmount`.
  - Validates `consumeFromReserved <= current reservedQuantity`.
  - Validates `(totalAmount - consumeFromReserved) <= Q_{available}` (unless `isUnlimited`).
  - Decreases `reservedQuantity` by `consumeFromReserved`.
- **Returns:** New instance with updated state.

## Domain Errors

- `InvalidAttributeError`: Thrown on invalid name, price, or UUID format.
- `InsufficientStockError`: Thrown when an operation exceeds available or reserved units.
- `InvalidTransitionError`: Thrown when internal logic rules are violated (e.g., consuming more from reservation than total purchase).
