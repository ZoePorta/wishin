# ADR 018: Unified Identity via Appwrite Anonymous Sessions

**Status:** Accepted  
**Date:** 2026-02-24  
**Amends:** [ADR 013](docs/adr/013-unified-transaction-state-model.md), [ADR 014](docs/adr/014-identity-and-repository-mapping-strategy.md)

## Context

The "Mother Factor" (defined in `vision.md`) is a core principle of Wishin, requiring a zero-friction experience for gift buyers (Guests). Our initial implementation used a volatile `guestSessionId` to track guest purchases. This approach had several limitations:

1. **UX Restrictions:** Guests could not see a history of their purchases or cancel an action once the immediate "Undo" window closed.
2. **Data Fragmentation:** Registering as a member required complex logic to migrate transactions from a `guestSessionId` to a new `userId`.
3. **Domain Complexity:** The `Transaction` aggregate required complex XOR logic to handle two different types of identity.

Appwrite provides **Anonymous Sessions**, which create a first-class (but unauthenticated) account. This allows us to treat all participants as users from the start.

## Decision

We will adopt Appwrite Anonymous Sessions as the primary mechanism for guest interaction.

1.  **Identity Unification**:
    - Remove `guestSessionId` from the Domain Layer (`Transaction` aggregate and related DTOs).
    - Every action (Purchase, Reservation, etc.) will be associated with a `userId`.
2.  **Expanded Guest Capabilities**:
    - Anonymous users will now have access to their "Gifting History".
    - Anonymous users are permitted to `CANCEL` their own transactions (transitioning from hard-delete "Undo" to soft-delete "Cancellation"). In line with domain rules, any user can only cancel their own transactions.
3.  **Permission Tiers (Business Rules)**:
    - **Anonymous Users**: Can only `PURCHASE` and `CANCEL` their own transactions. They CANNOT `RESERVE` items or create/manage wishlists.
    - **Registered Users**: Full access (Reservation, List Management, etc.).
4.  **Transition Strategy**:
    - When an anonymous user decides to register (Phase 5), we will update the existing account with credentials (email/password/OAuth) instead of creating a new one. This preserves the `userId` and all associated transactions automatically.
5.  **MVP Implementation Shortcut**:
    - To facilitate testing during development (up to the end of Phase 5), we will introduce an environment variable `EXPO_PUBLIC_BYPASS_ANONYMOUS_RESTRICTIONS` to allow anonymous users full permissions in development environments. This bypasses the role check to enable manual testing of all features without full registration logic being complete.

## Consequences

- **Pros**:
  - **Simplified Domain**: `Transaction` aggregate logic becomes cleaner by removing identity XOR rules.
  - **Enhanced UX**: Guests gain features previously reserved for members, improving trust and parity.
  - **Seamless Evolution**: The path from Guest to Member is natively supported by the infrastructure.
- **Cons**:
  - **Database Growth**: Every guest creates an account document in Appwrite.
  - **Cleanup Requirement**: Post-MVP, we will need a strategy to delete inactive anonymous accounts (e.g., after 90 days of inactivity) to prevent storage bloat.
  - **Cleanup Requirement**: Post-MVP, we will need a strategy to delete inactive anonymous accounts (e.g., after 90 days of inactivity) to prevent storage bloat.
