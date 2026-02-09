# Domain Entity: Wishlist

## Description

The `Wishlist` is the central aggregate root of the domain. It groups `WishlistItem` entities and defines the context in which they exist (privacy, ownership, theme). Like items, the Wishlist is **strictly immutable**.

## Validation Modes

The entity supports two validation modes to ensure consistent behavior with the rest of the domain:

- **STRICT** (Create & Update): Full validation. Enforces all structural and business rules (e.g., max items, valid visibility/participation).
- **STRUCTURAL** (Hydration): Enforces only structural integrity. Bypasses business rules to allow loading legacy data (e.g., lists exceeding the new 100-item limit).

### Structural Integrity (Always Enforced by All Modes)

- `id`, `ownerId` must be valid UUIDs.
- `items` must be a valid array (can be empty).
- `createdAt` and `updatedAt` must be valid Dates.
- `visibility` must be a valid Enum value.
- `participation` must be a valid Enum value.

### Business Rules (Enforced by STRICT)

- `title`: 3-100 chars, trimmed.
- `description`: max 500 chars (optional).
- `visibility`: Valid `WishlistVisibility` enum value (Default: LINK).
- `participation`: Valid `WishlistParticipation` enum value (Default: ANYONE).
- `items`: Maximum 100 items (MVP Limit).

## Attributes

| Attribute       | Type                    | Description                      | Constraints                              |
| :-------------- | :---------------------- | :------------------------------- | :--------------------------------------- |
| `id`            | `string` (UUID v4)      | Unique identifier                | Required                                 |
| `ownerId`       | `string` (UUID v4)      | ID of the user who owns the list | Required                                 |
| `title`         | `string`                | Human-readable title             | 3-100 chars, trimmed                     |
| `description`   | `string`                | Optional details                 | Max 500 chars                            |
| `visibility`    | `WishlistVisibility`    | Who can see the list             | Enum: `LINK`, `PRIVATE`                  |
| `participation` | `WishlistParticipation` | Who can act on the list          | Enum: `ANYONE`, `REGISTERED`, `CONTACTS` |
| `items`         | `List<WishlistItem>`    | Collection of items              | Max 100 items                            |
| `createdAt`     | `Date`                  | Timestamp of creation            | Required                                 |
| `updatedAt`     | `Date`                  | Timestamp of last update         | Required                                 |

## Domain Invariants

1. **Identity Immutability:** `id` and `ownerId` cannot be changed after creation.
2. **Item Cap:** A wishlist cannot contain more than 100 items (MVP).

## Operations (Behaviors)

### `reconstitute(props: WishlistProps)`

- **Effect:** Creates an instance from persistence, bypassing business rules (e.g., item cap).
- **Logic:** Trusts the database.
- **Returns:** `Wishlist` instance.

### `update(props: Partial<WishlistProps>)`

- **Effect:** Modifies editable properties (title, description, visibility, participation).
- **Restrictions:** Cannot modify `id`, `ownerId`, `items` (items are managed via specific item methods, though aggregate might coordinate).
- **Logic:** Creates a new instance with merged properties and applies STRICT validation.
- **Returns:** New instance with updated state.

### `addItem(item: WishlistItem)`

- **Effect:** Adds a new item to the list.
- **Logic:**
  - Validates `item.wishlistId` matches `this.id`.
  - Enforces Max 100 items limit (STRICT).
- **Returns:** New `Wishlist` instance containing the new item.

### `removeItem(itemId: string)`

- **Effect:** Removes an item from the list.
- **Logic:**
  - Checks if item exists.
- **Returns:** New `Wishlist` instance without the item.

### `equals(other: Wishlist)`

- **Effect:** Compares this entity with another `Wishlist`.
- **Logic:** Returns `true` if `this.id === other.id`.
- **Returns:** `boolean`

## Domain Errors

- `InvalidAttributeError`: Thrown on invalid title length, visibility/participation level or UUIDs.
- `LimitExceededError`: Thrown when trying to add items beyond the 100-item limit.
- `InvalidOperationError`: Thrown if trying to add an item belonging to another wishlist.
