# ADR 009: Client-Side Undo Window & Transaction Lifecycle

## Status

Accepted

## Context

Users often make mistakes when marking items as "Purchased" (e.g., clicking the wrong item). A common pattern to solve this is an "Undo" button available immediately after the action.

Since Wishin is a coordination tool for **external purchases** (not a marketplace), our terminology and flow must reflect that we are tracking intent/status, not processing financial orders.

Additionally, we need to distinguish between correcting an immediate mistake ("I clicked the wrong button") and a decision change ("I tracked this purchase, but I ended up not satisfying it").

Previous documentation (`vision.md`) suggested a 2-minute window. We are refining this to **30 seconds** to balance the "Mother Factor" (needing time to read and react) with the need to keep the system state stable and responsive.

## Decision

We have decided to differentiate **Undo** and **Cancel** as two distinct domain operations with different persistence strategies.

### 1. The "Undo" Operation (Hard Delete)

- **Scope**: Available to **ALL** users (Guests & Registered) immediately after marking an item as Purchased.
- **Mechanism**: **Physical Deletion** of the `Transaction` record.
- **Effect**: It is as if the action never happened. No audit trail of the mistake is kept.
- **Window**: **30 seconds** (Volatile Client Session).
- **Trigger**: Only via the "Undo Snackbar/Toast" in the UI.

### 2. The "Cancel" Operation (Soft Delete)

- **Scope**: Available **ONLY** to Registered Users via their **"My Gifting"** dashboard.
- **Mechanism**: State transition to `status: CANCELLED`.
- **Effect**: The transaction record is preserved for history to show that a contribution was attempted but withdrawn. The stock is released.
- **Window**: Indefinite.
- **Trigger**: Explicit action in the user's personal tracking area.

### 3. Client-Side Volatile Window

- **Immediate Commit**: The backend **immediately** executes the status change. There is no "pending" state.
- **Session Bound**: The "Undo" capability is a volatile token held in the client's memory. If the tab is closed or the app crashes, the right to "Undo" is lost (committed).
- **UI Requirement**: To prevent stacking of undo toasts or blocking interactions, the UI must include a **"Dismiss/Confirm" button** (X) on the popup. Clicking this closes the window immediately, removing the option to Undo and finalizing the UI state.

## Consequences

### Positive

- **Stateless Backend**: The backend does not need to know about "grace periods". It just exposes `deleteTransaction` (Undo) and `cancelTransaction` (Cancel).
- **Atomic Simplicity**: Inventory is always valid and consistent.
- **Clear Semantics**: "Undo" means "oops, wrong click" (erase it). "Cancel" means "I changed my mind" (log it).
- **Balanced UX**: 30 seconds is enough time for non-technical users to realize a mistake, but short enough to not block the UI or confuse inventory availability for others.

### Negative

- **Guest Edge Case**: If a Guest crashes during the 30s window, they cannot Undo (as they have no "My Gifting" history). This is an acceptable trade-off for simplicity and privacy.
