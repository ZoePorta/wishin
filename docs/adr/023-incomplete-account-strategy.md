# ADR 023: Incomplete Account Strategy

**Status:** Accepted  
**Date:** 2026-03-10  
**Amends:** [ADR 018](docs/adr/018-unified-identity-anonymous-sessions.md)

## Context

During the registration or anonymous promotion flow, the system performs two main operations:

1.  **Auth Account Update/Creation**: In Appwrite Auth (email/password or OAuth).
2.  **Profile Document Creation**: In the `profiles` collection (public metadata like `username`).

In a distributed environment (Client-Side implementation), achieving strict atomicity across these two disparate systems (Auth vs. Database) without a server-side transaction coordinator is impossible. A failure during step 2 (Profile creation) could lead to an "Incomplete Account" where the Auth account exists but the corresponding profile does not.

## Decision

We will adopt an **"Incomplete Account Strategy"** to handle these failures gracefully:

1.  **No Compensating Rollback (Client-Side)**: We will NOT attempt to delete the Auth account if profile creation fails.
    - The Appwrite Client SDK does not support user deletion (it's restricted to Server SDK).
    - Rolling back a "Promoted Anonymous" account would result in permanent data loss (guest items/history).
2.  **State Definitions**:
    - **Anonymous Guest**: Session active, `email` field in Auth is empty.
    - **Incomplete Member**: Session active, `email` field is present, but **Profile document is missing**.
    - **Complete Member**: Session active, `email` field is present, and **Profile document exists**.
3.  **UI-Driven Recovery**: The application must check for the existence of a profile upon login. If the Auth account exists but no profile is found, the user should be redirected to a profile completion flow.

## Consequences

- **Pros**:
  - Consistent and robust registration flow for both fresh and promoted users.
  - No risk of permanent data loss on failure.
  - Simplifies the Infrastructure layer by removing non-atomic cleanup logic.
- **Cons**:
  - Requires the UI to handle the "Incomplete Member" state.
  - Slightly more complex profile retrieval logic (must account for 404s).
