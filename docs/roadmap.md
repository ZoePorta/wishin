# Project Roadmap (Vertical Slices - Linear Flow)

## Phase 1: Foundation & Shared Kernel

- [x] ADR 014: Identity & Repository Mapping Strategy (UUIDs vs Appwrite IDs).
- [x] Consolidate Value Objects: Move Priority, Visibility, Participation, etc., to `value-objects/`.
- [x] Infrastructure Setup: Initialize Appwrite SDK base client.

---

## Phase 2: Visualization

### 2.1 Domain Refinement

- [x] Define `WishlistRepository` interface with `findById(id: string): Promise<Wishlist | null>`.

### 2.2 Application Layer (TDD)

- [x] **DTOs Definition:** Create `GetWishlistInput` and `WishlistOutput` (DTOs).
- [x] **TDD - GetWishlistByUUID:**
  - [x] Phase RED: Unit test using a Mock Repository (should return wishlist DTO).
  - [x] Phase GREEN: Logic to call `repo.findById` and map to DTO.

### 2.3 Infrastructure Layer (Appwrite)

- [x] **Appwrite Mapping:** Implement `WishlistMapper` (to/from Appwrite documents).
- [x] **Integration Tests:** Test `AppwriteWishlistRepository.findById()` against real Appwrite collection.

### 2.4 UI & Presentation

- [x] Basic Expo Router setup & Wishlist view (Read-only view).

---

## Phase 3: Owner Experience (Creation & Control)

### 3.1 Domain Refinement

- [x] Extend `WishlistRepository` interface with `save(wishlist: Wishlist): Promise<void>` and `delete(id: string): Promise<void>`.

### 3.2 Application Layer (TDD)

- [x] **DTOs Definition:** Create `CreateWishlistInput`, `AddWishlistItemInput`, `UpdateWishlistItemInput`, `RemoveWishlistItemInput`.
- [x] **TDD - CreateWishlist:**
  - [x] Phase RED: Test explicit visibility/participation requirements (ADR 011).
  - [x] Phase GREEN: Logic to instantiate `Wishlist` and call `repo.save()`.
- [ ] **TDD - AddWishlistItem:**
  - [ ] Phase RED: Test retrieval -> add -> save cycle.
  - [ ] Phase GREEN: Implementation of coordination logic.
- [ ] **TDD - Update/Remove Item:**
  - [ ] Phase RED: Test editing item metadata and removing items.
  - [ ] Phase GREEN: Logic to update aggregate state and persist.

### 3.3 Infrastructure Layer (Appwrite)

- [ ] **Schema Definition:** Create collections/attributes in Appwrite matching `UserProps` and `WishlistProps`.
- [ ] **Integration Tests:**
  - [ ] Test `AppwriteWishlistRepository.save()` (Insert and Update scenarios).
  - [ ] Test `AppwriteWishlistRepository.findById()` ensures full reconstitution (including items).

### 3.4 UI & Presentation

- [ ] Owner Dashboard: Form for wishlist creation and item management.

---

## Phase 4: Gifting & Synchronization (Transactions)

### 4.1 Domain Refinement

- [ ] Define `TransactionRepository` interface with `save`, `findById`, and `findByItemId`.
- [ ] Refine `WishlistItem` invariants for atomic stock updates.

### 4.2 Application Layer (TDD)

- [ ] **DTOs Definition:** `ReserveItemInput`, `PurchaseItemInput`, `ConfirmPurchaseInput`, `CancelTransactionInput`.
- [ ] **TDD - Gifting Cycles:**
  - [ ] **ReserveItem:** RED (Registered only) -> GREEN (Coordination).
  - [ ] **DirectPurchase:** RED (Guest/User) -> GREEN (Immediate stock update).
  - [ ] **Undo (Immediate):** RED (Hard delete within window) -> GREEN (Implementation).
  - [ ] **Confirm/Cancel:** RED (State transitions) -> GREEN (Persistence).

### 4.3 Infrastructure Layer (Appwrite)

- [ ] **Schema Definition:** Create `Transactions` collection.
- [ ] **Appwrite Realtime:** Setup listener for stock level changes (Sync UI).
- [ ] **Integration Tests:** Test transaction persistence and stock consistency.

### 4.4 UI & Presentation

- [ ] Guest interaction: Reservation/Purchase buttons with immediate "Undo" snackbar.

---

## Phase 5: Identity & Evolution

### 5.1 Application Layer

- [ ] **TDD - Auth:** `RegisterUser` and `LoginUser` use cases.
- [ ] **TDD - History:** `GetGiftingHistory` (Filtering transactions by UserID).

### 5.2 Infrastructure Layer

- [ ] **Appwrite Auth:** Implement `AuthService` adapter.
- [ ] **Identity Mapping:** ADR 014 implementation details.

### 5.3 UI & Presentation

- [ ] User Profile & "My Gifting" Dashboard.
- [ ] Final Polish: Theme system and micro-animations.
