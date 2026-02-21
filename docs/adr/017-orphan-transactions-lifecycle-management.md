# ADR 017: Orphan Transactions Lifecycle Management

## Status

Proposed

## Context

In our distributed environment, deleting a `WishlistItem` or a `User` involves cascading effects on pending `RESERVED` transactions. While use cases must be designed to automatically cancel these reservations, certain failures (e.g., network partitions, service crashes) might lead to "orphan" transactions—those where `itemId` or `userId` is `null` but the status remains `RESERVED`.

We need a robust strategy to:

1. Prevent illegal operations on orphan transactions (like confirming a purchase).
2. Allow desired terminal operations (like cancellation).
3. Self-heal inconsistencies during data recovery.

## Decision

We have decided on the following lifecycle management for orphan transactions:

### 1. Automatic Cancellation in Use Cases

Any use case responsible for deleting a `WishlistItem` or a `User` MUST proactively attempt to cancel all associated `RESERVED` transactions.

### 2. Aggregate-Level Enforcement

The `Transaction` aggregate will handle orphan states as follows:

- **`confirmPurchase()`**: MUST enforce `ValidationMode.STRICT`. Since `STRICT` mode requires a non-null `itemId`, any attempt to confirm an orphan transaction will throw an `InvalidAttributeError`.
- **`cancel()`**: MUST use `ValidationMode.STRUCTURAL` when returning the new instance. This allows transitioning an orphan transaction to the `CANCELLED` terminal state, which is the desired behavior for inconsistent records.

### 3. Inconsistency Correction (Self-Healing)

When recovering data from persistence (e.g., via a Repository or a specialized Background Job), any transaction found in a `RESERVED` state but with a `null` `itemId` or `userId` MUST be treated as an inconsistency.

- The system should automatically call `cancel()` on these orphans and persist the new `CANCELLED` state to the database.
- If a use case attempts to perform a `confirmPurchase()` on such an orphan before it is auto-corrected, the aggregate will block it, and the use case should ensure the state is corrected to `CANCELLED`.

## Consequences

- **Consistency**: Prevents inventory from being permanently locked by reservations pointing to non-existent items.
- **Robustness**: Allows the system to gracefully handle partial failures during deletion of primary entities.
- **Safety**: Blocks revenue-critical operations (purchases) on inconsistent data while allowing cleanup (cancellations).
- **Technical Debt**: Requires consumers of the `Transaction` aggregate to handle potential `InvalidAttributeError` during purchase confirmation by implementing fallback correction logic.
