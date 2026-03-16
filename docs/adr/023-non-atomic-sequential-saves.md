# ADR 023: Non-Atomic Sequential Saves and Compensating Rollbacks for MVP

## Status

Superseded by [ADR 028](file:///home/zoe/Documents/wishin/docs/adr/028-accelerate-appwrite-functions.md) (2026-03-16)

## Context

The "Wishin" domain requires multi-entity updates for core gifting flows (e.g., updating a `WishlistItem` inventory and creating a `Transaction` record). Ideally, these operations should be atomic to ensure data consistency.

However, the current infrastructure (Appwrite as a BaaS) does not support native cross-collection ACID transactions directly from the client-side SDK.

Implementing full atomicity at this stage would require migrating logic to server-side Appwrite Functions (Phase 6), which would significantly increase implementation complexity and delay the MVP.

## Decision

We will use **non-atomic sequential saves** at the Application Layer (Use Cases) combined with **compensating rollbacks**.

### Implementation Pattern

1. **Phase 1: Domain Update**: Update the aggregate state (e.g., `wishlist.reserveItem()`).
2. **Phase 2: Primary Persistence**: Save the updated aggregate (e.g., `wishlistRepo.save()`).
3. **Phase 3: Secondary Persistence**: Attempt to save the related entity (e.g., `transactionRepo.save()`).
4. **Phase 4: Compensating Rollback**: If Phase 3 fails, catch the error and attempt to "undo" Phase 1 & 2 by re-saving the aggregate in its original state or calling a specific cancellation method (e.g., `wishlist.cancelReservation()`).

### Critical Rules

- **Logging**: All rollback attempts (successful or failed) MUST be logged with `error` or `info` level to allow manual reconciliation if a critical failure occurs.
- **Optimistic Concurrency**: The domain uses versioning (ADR 012) to prevent accidental overwrites during rollback if another concurrent process updated the entity.

## Consequences

### Positive

- **Speed to Market**: Allows rapid development of core features using the client SDK without waiting for server-side infrastructure.
- **Simplicity**: Keeps the logic visible within the Use Case.

### Negative

- **Consistency Risk**: There is a small window where Phase 2 succeeds but the system crashes before Phase 4 can complete, leaving the database in an inconsistent state (inventory occupied but no transaction record).
- **Complexity**: Application logic must explicitly handle rollback scenarios.

### Future Mitigation

In **Phase 6**, these critical coordination blocks will be moved to **Appwrite Functions**. This will allow the infrastructure layer to handle the sequence in a closer-to-atomic environment (or using real transactions if supported by the underlying DB at that time), removing the need for manual rollbacks in the domain package.
