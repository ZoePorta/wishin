# Project Roadmap (MVP Phase 1)

Based on the current implementation of core aggregates, the following steps are prioritized to complete the MVP:

## 1. Domain Layer Completion

- [ ] **Consolidate Value Objects**: Move `Priority`, `Visibility`, `Participation`, and `TransactionStatus` to `packages/domain/src/value-objects/`.
- [ ] **Repository Interfaces**: Define `UserRepository`, `WishlistRepository`, and `TransactionRepository` in `packages/domain/src/repositories/`.
- [ ] **Domain Services**: Implement `WishlistService` for cross-aggregate logic (e.g., item cloning between lists).

## 2. Application Layer (Use Cases)

- [ ] **Identity & Session**: Implement `InitializeGuestSession` and `RegisterUser`/`LoginUser` use cases.
- [ ] **Wishlist Management**: Implement `CreateWishlist` (enforcing ADR 011), `GetWishlistByUUID`, and `AddWishlistItem`.
- [ ] **Frictionless Transactions**: Implement `ReserveItem` and `PurchaseItem` coordinating `Wishlist` and `Transaction` aggregates.
- [ ] **Audit & History**: Implement `GetGiftingHistory` for registered users.

## 3. Infrastructure Layer

- [ ] **Appwrite Adapter**: Setup base Appwrite SDK client and authentication adapter.
- [ ] **Persistence Adapters**: Implement Domain Repositories using Appwrite Databases.
- [ ] **Realtime Synchronization**: Implement an adapter for Appwrite Realtime to push stock updates to all clients.

## 4. Application UI (Expo)

- [ ] **Core Architecture**: Setup routing (Expo Router), state management (Zustand/TanStack Query), and theme system.
- [ ] **Public Wishlist View**: Implement the "Mother Factor" entry point (Link-based guest access).
- [ ] **Owner Dashboard**: Implement private wishlist management and item creation.
- [ ] **Gifter Dashboard**: Implement "My Reservations" and "Gifting History" for registered members.
