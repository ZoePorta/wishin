# ADR 027: Defer Anonymous Session Creation

**Status:** Accepted  
**Date:** 2026-03-11  
**Amends:** [ADR 018](./018-unified-identity-anonymous-sessions.md)

## Context

ADR 018 established that every participant (Guest or Member) should be treated as a user from the start by creating an Appwrite Anonymous Session on app load. While this simplified the domain logic, it led to:

1.  **Database Bloat**: Every single app load creates an account in Appwrite, even for casual browsers who never interact with the system.
2.  **Privacy Concerns**: Creating an account without explicit user action or intent.

The "Mother Factor" still requires a low-friction guest purchase flow, but this can be achieved by deferring session creation until the user explicitly decides to "Continue as Guest" during the purchase process.

## Decision

We will defer the creation of Appwrite Anonymous Sessions until they are strictly necessary for a state-changing operation (e.g., purchasing an item).

1.  **Passive Initialization**: On app load, the system will only attempt to RESTORE an existing session (if any). If no session exists, the user will remain in an "Unauthenticated" state (no User ID).
2.  **Explicit Guest Creation**:
    - When a user attempts to "Purchase" or "Mark as Bought" without an active session, a modal will prompt them to Sign Up / Log In or "Continue as Guest".
    - Selecting "Continue as Guest" will explicitly trigger the creation of an Anonymous Session.
3.  **Infrastructure Changes**:
    - `UserRepository.getCurrentUserId()` will now return `Promise<string | null>` instead of `Promise<string>`.
    - `SessionAwareRepository.ensureSession()` is renamed to `resolveSession()` and will support an optional flag to create an anonymous session if missing (defaulting to `false`).
4.  **UI Responsibility**: The UI layer (specifically the purchase flow) is responsible for ensuring a session exists before calling use cases that require a `userId`.

## Consequences

- **Pros**:
  - Significantly reduces Appwrite database bloat.
  - Better aligns with user intent (sessions created only when acting).
  - Clearer distinction between "Browsing Guest" and "Acting Guest".
- **Cons**:
  - Requires UI changes to handle the "Unauthenticated" state and the "Session Modal".
  - Use cases that previously assumed a `userId` must now be called with a valid ID ensured by the application layer.
