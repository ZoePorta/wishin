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

1.  **Identity Decoupling**:
    - **Source of Truth**: Appwrite Auth service is the master of `userId`.
    - **Loose Mapping**: Database collections (`wishlists`, `transactions`) will use **String attributes** for `userId` / `ownerId` instead of Relationship attributes. This allows anonymous users (who lack documents in the `profiles` collection) to be first-class citizens in the domain while maintaining structural integrity via application-level logic.
    - **Implicit Identity**: Every session (Anonymous or Authenticated) provides a persistent `userId`.
2.  **Profiles Persistence**:
    - The existing `users` database collection is renamed to `profiles` (or `user_metadata`).
    - This collection stores **only public metadata** (`username`, `avatar`, `bio`).
    - **Email** is removed from the database collection as it is handled securely by Appwrite Auth.
    - **Registration Flow**: When an anonymous user converts, we update their Auth record. Their profile record (if created) remains linked by the same `userId`.
3.  **Expanded Guest Capabilities**:
    - Anonymous users will now have access to their "Gifting History" via their Auth `userId`.
    - Anonymous users are permitted to `CANCEL` their own transactions.
4.  **Permission Tiers (Business Rules)**:
    - **Anonymous Users**: Can only `PURCHASE` and `CANCEL` their own transactions. They CANNOT `RESERVE` items or create/manage wishlists (which require a registered profile).
    - **Registered Users**: Full access.
5.  **MVP Implementation Shortcut**:
    - An environment variable `EXPO_PUBLIC_BYPASS_ANONYMOUS_RESTRICTIONS` will bypass role checks in development.

## Consequences

- **Pros**:
  - **Simplified Domain**: `Transaction` aggregate logic becomes cleaner by removing identity XOR rules.
  - **Enhanced UX**: Guests gain features previously reserved for members, improving trust and parity.
  - **Seamless Evolution**: The path from Guest to Member is natively supported by the infrastructure.
- **Cons**:
  - **Database Growth**: Every guest creates an account document in Appwrite.
  - **Cleanup Requirement**: Post-MVP, we will need a strategy to delete inactive anonymous accounts (e.g., after 90 days of inactivity) to prevent storage bloat.
  - **Cleanup Requirement**: Post-MVP, we will need a strategy to delete inactive anonymous accounts (e.g., after 90 days of inactivity) to prevent storage bloat.
