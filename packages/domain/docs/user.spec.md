# Domain Entity: User

## Description

The `User` entity represents a registered member of the platform. It serves as the root for user-specific data (like Wishlists) and encapsulates profile information. This entity is **strictly immutable**.

## Validation Modes

The entity supports two validation modes to ensure consistent behavior with the rest of the domain:

- **STRICT** (Create & Update): Full validation. Enforces all structural and business rules.
- **STRUCTURAL** (Hydration): Enforces only structural integrity. Bypasses business rules (e.g., legacy username formats) to ensure data can always be loaded from persistence.

### Structural Integrity (Always Enforced by All Modes)

- `id` must be a valid UUID v4.
- `email` and `username` must be non-empty strings.

### Business Rules (Enforced by STRICT)

- `email`: Must be a valid email format.
- `username`: 3-30 characters, alphanumeric or common safe characters (.-\_).
- `bio`: Max 500 characters.
- `imageUrl`: Must be a valid URL if present.

## Attributes

| Attribute  | Type               | Description           | Structural (Hydration) | Business (Strict)                |
| :--------- | :----------------- | :-------------------- | :--------------------- | :------------------------------- |
| `id`       | `string` (UUID v4) | Unique identifier     | Required, UUID v4      | Immutable                        |
| `email`    | `string`           | Unique email address  | Required, non-empty    | Valid email format               |
| `username` | `string`           | Display name (handle) | Required, non-empty    | 3-30 chars, alphanumeric + `.-_` |
| `imageUrl` | `string`           | Profile picture URL   | Optional               | Valid URL                        |
| `bio`      | `string`           | User biography        | Optional               | Max 500 chars                    |

## Domain Invariants

1. **Immutability:** Any state change must result in a new instance of `User`.
2. **Identity Persistence:** The `id` cannot be changed after creation.

## Operations (Behaviors)

### `create(props: UserProps)`

- **Effect:** Initializes a new User domain entity.
- **Validation:** Enforces **STRICT** validation (Business Rules + Structural).
- **Returns:** The created `User` or a validation error.

### `update(props: Partial<UserProps>)`

- **Effect:** Modifies editable properties (`username`, `imageUrl`, `bio`).
- **Restrictions:** Cannot modify `id` or `email`.
- **Validation:** Enforces **STRICT** validation (Business Rules + Structural).
- **Returns:** New `User` instance with updated state.

### `reconstitute(props: UserProps)`

- **Effect:** Creates an instance from persistence.
- **Validation:** Enforces **STRUCTURAL** validation only.
- **Returns:** `User` instance.

### `equals(other: User)`

- **Effect:** Compares this entity with another `User`.
- **Logic:** Returns `true` if `this.id === other.id`, otherwise `false`.
- **Returns:** `boolean`

## Domain Errors

- `InvalidAttributeError`: Thrown when validation rules (format, length) are violated.
