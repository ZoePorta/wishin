# ADR 008: Explicit Cancellation Flow

## Status

Accepted
Amends [ADR 006](006-domain-modeling-patterns.md) (Cancellation Flow)

## Context

In the initial design of the `WishlistItem` entity, the `cancelPurchase` operation allowed for an optional "auto-reservation" behavior. This meant that when a purchase was canceled, the items could optionally be moved directly back to the `Reserved` state instead of the `Available` pool.

While intended to support a "undo buy but keep reserved" workflow, this introduced several issues:

1.  **Compound Complexity**: The method had to handle multiple destination states, increasing the cyclomatic complexity of the domain logic.
2.  **"Magic" State Transitions**: It created a side effect where a cancellation operation could implicitly act as a reservation operation, obscuring the intent of the transaction.
3.  **Testing Difficulty**: Verifying the correctness of the entity required covering permutations of cancellation flags, making tests more brittle.
4.  **Race Conditions**: Doing two logical moves (Un-purchase + Reserve) in one atomic step complicated the inventory invariant checks, especially in a high-concurrency environment.

## Decision

We have decided to **eliminate the "auto-reservation" option** from the `cancelPurchase` workflow.

1.  **Atomic & Explicit**: `cancelPurchase` now strictly moves items from `Purchased` $\rightarrow$ `Available`. It does _nothing_ else.
2.  **Separation of Concerns**: If a user wishes to "undo a purchase and keep it reserved", the application layer must execute two distinct domain commands:
    1.  `item.cancelPurchase(amount)`
    2.  `item.reserve(amount)`
3.  **Simplification**: The `WishlistItem` entity no longer needs to know about "restocking intent." It simply releases stock.

## Consequences

### Positive

- **Simplified State Machine**: The transitions are now strictly linear and predictable.
- **Improved Testability**: Each method does exactly one thing, making unit tests focused and declarative.
- **Clearer Audit Trail**: Explicit commands mean the system logs/history will show "Purchase Canceled" followed explicitly by "Item Reserved", rather than a confusing single event.
- **Reduced Bug Surface**: Removing the conditional logic for auto-reservation eliminates a class of potential logic errors regarding stock limits.

### Negative

- **Client Complexity**: The client or application layer (use case) is now responsible for chaining these two operations if the user intent is "revert to reserved". This may require handling the edge case where step 1 succeeds but step 2 fails (e.g., due to a race condition where someone else snatches the stock in between), though this is a rare and acceptable trade-off for domain clarity.
