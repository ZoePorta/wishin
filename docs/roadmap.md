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
- [x] **TDD - AddWishlistItem:**
  - [x] Phase RED: Test retrieval -> add -> save cycle.
  - [x] Phase GREEN: Implementation of coordination logic.
- [x] **TDD - Update/Remove Item:**
  - [x] Phase RED: Test editing item metadata and removing items.
  - [x] Phase GREEN: Logic to update aggregate state and persist.

### 3.3 Infrastructure Layer (Appwrite)

- [x] **Schema Definition:** Create collections/attributes in Appwrite matching `ProfileProps` and `WishlistProps`.
- [x] **Integration Tests:**
  - [x] Test `AppwriteWishlistRepository.save()` (Insert and Update scenarios).
  - [x] Test `AppwriteWishlistRepository.findById()` ensures full reconstitution (including items).

### 3.4 UI & Presentation

- [x] Owner Dashboard: Form for wishlist creation and item management.
- [x] **Image Upload — Infrastructure & Use Cases:** Core storage repository and domain logic.
- [x] **Image Upload — UI & Integration Testing:** User interface integration and end-to-end verification.

---

## Phase 4: Gifting & Direct Purchase (MVP Focus)

### 4.1 Domain & Application (TDD)

- [x] Define `TransactionRepository` interface.
- [x] Refine `WishlistItem` invariants for atomic stock updates.
- [x] **DTOs Definition:** `PurchaseItemInput` (Main focus), `UndoPurchaseInput`.
- [x] **TDD - Gifting Cycles (Direct Purchase):**
  - [x] **DirectPurchase:** RED (Anonymous/Registered) -> GREEN (Immediate stock update).
  - [x] **Undo (Immediate):** RED (Hard delete within window) -> GREEN (Implementation).

### 4.2 Infrastructure Layer (Appwrite)

- [x] **Schema Definition:** Create `Transactions` collection.
- [x] **Appwrite Repository:** Implement `AppwriteTransactionRepository`.
- [x] **Infrastructure (Serverless):** `sync-item-stats` Function (Atomic counters for `purchasedQuantity`).
- [x] **Integration Tests:** Test transaction persistence and stock consistency.

### 4.3 UI & Presentation

- [x] Guest interaction: "Buy" button integration.
- [x] Clean UI: No "Reserved" status shown during MVP (ADR 025).

---

## Phase 5: Identity & Security

### 5.1 Application & Logic

- [x] **TDD - Auth:** `RegisterUser` and `LoginUser` use cases.
- [x] **Identity Mapping & Evolution:** Seamless conversion from anonymous to registered users (ADR 018).

### 5.2 Infrastructure Layer

- [x] **Appwrite Auth:** Implement `AuthService` adapter implementation (Using Anonymous Sessions - ADR 018).
- [ ] **Security & Permissions:** Configure Appwrite collection/attribute permissions in `provision.ts`.

---

## Phase 6: UI Polish & Presentation

- [ ] **UI:** Immediate "Undo" snackbar after purchase.
- [ ] **Final Polish:** Theme system refinement and micro-animations.
- [ ] **Web Responsiveness:** Ensure a premium and fully responsive experience for the web client across all viewports.

---

## Post-MVP / Future Enhancements

- [ ] **Mobile Apps:** Native iOS and Android versions (using Expo).
- [ ] **Google OAuth2:** Login/Register integration (UI implementation).
- [ ] **History:** `GetGiftingHistory` Use Case (Purchases only for MVP).
- [ ] **UI:** User Profile & "My Gifting" Dashboard.
- [ ] **Pruning Alerts**: Implement Appwrite Function (DB Trigger) to notify users when a transaction status changes to `CANCELLED_BY_OWNER`.
- [ ] **Advanced Transactional Atomicity**: Implement Appwrite Functions to handle complex multi-entity updates (e.g., Stock + Transaction + Wishlist Version) atomically on the server.
- [ ] **Appwrite Realtime:** Setup listener for stock level changes (Sync UI).

- [ ] **Reservations System**: Full implementation of the "soft lock" flow.
  - [ ] `ReserveItem` use case integration.
  - [ ] `Confirm/Cancel` reservation UI and logic.
  - [ ] Smart Consumption (FIFO) for multiple reservations (ADR 024).
- [ ] **Selective Pruning**: Implement logic to preserve reservations when reducing total quantity (replaces ADR 019).
- [ ] **Advanced Notifications**: Implement real-time alerts for reservation cancellations (pruning, expiration).
- [ ] **Transaction Data Sync**: Implement an Appwrite Function (DB Trigger) to synchronize denormalized fields and resolve data staleness (ADR 021).
  - **Triggers**: `WishlistItem` metadata updates or `Profile` username changes.
  - **Sync Rules**:
    - `ownerUsername`: Always synchronized across all transactions (informative).
    - `itemName`, `itemPrice`, `itemCurrency`, `itemDescription`:
      - **Sync-able**: Only for transactions in `RESERVED` status.
      - **Immutable**: Frozen for `PURCHASED` status to preserve audit/financial integrity of the purchase.
  - **Operational Strategy**: Use paginated background processing with exponential backoff and idempotent retries to handle items with large transaction volumes (popular items).
- [ ] **TDD - History:** `GetGiftingHistory` (Purchases only for MVP).
- [ ] User Profile & "My Gifting" Dashboard.
