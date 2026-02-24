# ADR 017: Orphan Transactions Lifecycle Management

## Status

Accepted

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

> [!NOTE]
> **MVP note**: The auto-cancellation and persistence of `CANCELLED` states described in Section 3 are deferred in the MVP. As detailed in Section 4, the infrastructure currently physically deletes records.

### 4. MVP Infrastructure Simplification

> [!IMPORTANT]
> **MVP note**: For the MVP, the Infrastructure layer physically deletes transaction documents when the parent `WishlistItem` or `User` is deleted (Infrastructure cascade), so transactions are removed rather than left with null foreign keys.
>
> **Experimental Feature Alert**: This behavior relies on **Appwrite Relationships**, which is currently an experimental feature. Its cascade-deletion behavior may change in future SDK updates, posing a stability risk.
>
> Despite this infrastructure-level physical deletion, the Domain Aggregate is prepared for nullability. This ensures we can migrate to a "SetNull" + Soft-Cleanup strategy in later phases (SetNull instead of Cascade) without breaking domain logic.

## Consequences

- **Consistency**: Prevents inventory from being permanently locked by reservations pointing to non-existent items.
- **Robustness**: Allows the system to gracefully handle partial failures during deletion of primary entities.
- **Safety**: Blocks revenue-critical operations (purchases) on inconsistent data while allowing cleanup (cancellations).
- **Audit Trail Gap (MVP)**: Physical cascade deletion (Section 4) means orphaned Transaction records are permanently removed instead of being marked as `CANCELLED`, creating a gap in historical auditing and observability during the MVP phase.
- **Technical Debt**: Post-MVP migration to "SetNull" will require implementing the domain-layer correction logic described in Section 3 to ensure system consistency when records are no longer physically deleted.
