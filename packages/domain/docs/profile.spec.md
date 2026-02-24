# Domain Entity: Profile

## Description

The `Profile` entity represents high-level public metadata for a user. It tracks information like username, bio, and avatar. This entity is **strictly immutable**.

> [!NOTE]
> **Identity & Authentication**: Authentication, including email and private identifiers, is handled by Appwrite Auth. The `Profile` aggregate only stores public metadata linked to the Auth `userId`.

## Validation Modes

The entity supports two validation modes:

- **STRICT** (Create & Update): Full validation. Enforces all structural and business rules.
- **STRUCTURAL** (Hydration): Enforces only structural integrity. Bypasses business rules (e.g., legacy username formats) to ensure data can always be loaded from persistence.

### Structural Integrity (Always Enforced)

- `id`: Must be a valid identity (UUID v4 or Appwrite ID).
- `username`: Must be a non-empty string.

### Business Rules (Enforced by STRICT)

- `username`: 3-30 chars, alphanumeric + `.-_`.
- `bio`: Max 500 characters.
- `imageUrl`: Must be a valid URL (http/https) if present.

## Attributes

| Attribute  | Type               | Description           | Structural (Hydration) | Business (Strict)                |
| :--------- | :----------------- | :-------------------- | :--------------------- | :------------------------------- |
| `id`       | `string`           | Unique identifier     | Required, Valid ID     | —                                |
| `username` | `string`           | Display name (handle) | Required, non-empty    | 3-30 chars, alphanumeric + `.-_` |
| `imageUrl` | `string`           | Profile picture URL   | Optional               | Valid URL (http/https)           |
| `bio`      | `string`           | User biography        | Optional               | Max 500 chars                    |

## Domain Invariants

1. **Immutability:** Any state change must result in a new instance of `Profile`.
2. **Identity Persistence:** The `id` cannot be changed after creation.

## Operations (Behaviors)

### `create(props: ProfileProps)`

- **Effect:** Initializes a new Profile domain entity.
- **Validation:** Enforces **STRICT** validation.
- **Returns:** The created `Profile` or throws `InvalidAttributeError`.

### `update(props: Partial<ProfileProps>)`

- **Effect:** Modifies editable properties (`username`, `imageUrl`, `bio`).
- **Restrictions:** Cannot modify `id`.
- **Validation:** Enforces **STRICT** validation.
- **Returns:** New `Profile` instance with updated state.

### `reconstitute(props: ProfileProps)`

- **Effect:** Creates an instance from persistence.
- **Validation:** Enforces **STRUCTURAL** validation only.
- **Returns:** `Profile` instance.

### `equals(other: unknown)`

- **Effect:** Compares this entity with another `Profile`.
- **Logic:** Returns `true` if `this.id === other.id`, otherwise `false`.
- **Returns:** `boolean`

### `toProps()`

- **Effect:** Returns a shallow copy of the internal state.
- **Returns:** `ProfileProps` object.

## Domain Errors

- `InvalidAttributeError`: Thrown when validation rules (format, length) are violated.
