# ADR 013: Unified Transaction State Model

## Status

Amended by [ADR 018](./018-unified-identity-anonymous-sessions.md) (Allows anonymous users to cancel transactions).

## Context

Initially, the `Transaction` entity relied on a combination of `TransactionType` (RESERVATION, PURCHASE) and `TransactionStatus` (ACTIVE, CANCELLED). This dual-field approach introduced unnecessary complexity in domain validations and increased the risk of state inconsistencies.

> [!NOTE]
> **Update (ADR 018)**: The permission model was expanded to allow anonymous sessions to access their history and reach the `CANCELLED` state.

Furthermore, the requirement to handle both anonymous guests and registered users necessitated a clearer distinction in how transactions are initiated, as guests are only permitted to perform direct purchases (no reservations).

## Decision

We decided to simplify the transaction lifecycle by collapsing the type and status into a single three-state model:

1.  **RESERVED:** Represents a temporary lock on inventory, exclusive to registered users (`userId` mandatory).
2.  **PURCHASED:** Represents the final commitment of inventory, available to both users and guests.
3.  **CANCELLED:** A terminal state representing the voiding of a reservation or purchase, triggering inventory restock.

### Explicit Factory Methods

To enforce these rules at the entry point, we replaced the generic `create()` method with state-specific static factory methods:

- `createReservation()`: Enforces `userId` presence and sets the initial state to `RESERVED`.
- `createPurchase()`: Handles both guest and user scenarios and sets the initial state to `PURCHASED`.

### Common Logic Delegation

Both factory methods delegate to a **private static `create()`** method that handles shared initialization (UUID generation, date assignment).

### Immutability

In alignment with the project's architectural mandates, any state transition (e.g., `confirmPurchase()`, `cancel()`) MUST return a **new immutable instance** of the `Transaction` aggregate.

## Consequences

- **Integrity:** Guaranteed inventory integrity by avoiding stock reservation duplicates.
- **Simplicity:** Simplified domain validations by eliminating the management of multiple linked entities/fields.
- **Technical Debt:** Reduced debt by removing the need to synchronize purchase records with previous reservations.
- **Clarity:** Better role isolation between registered users and guests.
