# ADR 016: Database Seeding Strategy

## Status

Proposed

## Context

As the project grows, we need a reliable and idempotent way to populate development and test environments with initial data. The previous seeding approach used random IDs (`ID.unique()`), making repeated runs non-idempotent and causing data duplication if not managed carefully.

## Decision

We will implement a deterministic seeding strategy with the following characteristics:

1.  **Stable IDs**: Each seed entity (User, Wishlist, Item, Transaction) will use a deterministic stable UUID v4 instead of `ID.unique()`.
2.  **Idempotency**: We will use `upsertRow` (or a similar find-or-create pattern) to ensure that repeated runs of the seed script update existing records instead of creating duplicates.
3.  **Environment Isolation**: Namespacing is handled via the `EXPO_PUBLIC_DB_PREFIX` environment variable, ensuring that seeding only affects the intended workspace (e.g., `dev_`, `test_`).
4.  **Domain Mapping**: Seed data will be typed using domain-aligned interfaces to ensure consistency with the application's data models.

## Consequences

- **Reliability**: Developers can run `db:seed` multiple times to reset or update their local data without worrying about duplicates.
- **Consistency**: Test environments will have predictable data, which simplifies writing integration and E2E tests.
- **Documentation**: The seed script serves as a living documentation of the expected data shape and relationships.

## Implementation Details

- Use `tablesDb.upsertRow` or `tablesDb.createRow` with stable primary keys.
- Define TypeScript interfaces for seed data to improve maintainability and catch schema mismatches during development.
