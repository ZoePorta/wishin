# ADR 007: Validation Modes & Legacy Data Strategy

## Status

Accepted
Amends [ADR 006](006-domain-modeling-patterns.md) (Validation Strategy)

## Context

In evolving systems like Wishin, business rules (e.g., minimum name length, required fields) tend to become stricter over time. However, applying new rules to existing data creates a "Legacy Data Lock-out":

1.  **Guests cannot interact with old items**: If `WishlistItem.reserve()` enforces strict validation, a guest cannot reserve a legacy item with a short name (e.g., "PC") because the system rejects the entire entity state as invalid.
2.  **Database loads fail**: If validation is enforced on read (reconstitution), the application crashes when trying to load valid legacy data.
3.  **Owner privacy vs. Inventory integrity**: Owners may need to reduce the `totalQuantity` of an item to a number lower than what is already `reserved` or `purchased`. A strict invariant ($Q_{total} \ge Q_{reserved} + Q_{purchased}$) would prevent this update, or worse, force the system to reveal hidden purchases (privacy leak) or delete valid reservations.

We need a strategy to separate **Structural Integrity** (data corruption) from **Business Rules** (contextual policy) and **Inventory Invariants** (stock mechanics).

## Decision

We adopt a **Granular Validation Strategy** using four distinct modes in our Domain Entities. This allows the system to be strict where necessary but permissive where required for continuity.

### 1. STRICT Mode (Creation)

- **Usage**: Factory methods (`WishlistItem.create()`).
- **Scope**: Enforces **ALL** rules:
  - Structural Integrity (types, UUIDs).
  - Business Rules (lengths, formats).
  - Inventory Invariants.
- **Goal**: Prevent new invalid data from entering the system.

### 2. EVOLUTIVE Mode (Owner Updates)

- **Usage**: Mutation methods (`WishlistItem.update()`).
- **Scope**:
  - **Enforces**: Structural Integrity + Business Rules.
  - **Relaxes**: Inventory Invariants.
- **Goal**: Allows owners to update item details (e.g., fix a typo, change price) even if the item is currently "over-committed" (Total < Reserved + Purchased).
- **Constraint**: If an owner touches a legacy item, they must bring it up to current Business standards (e.g., fix the name length) to save the update. "If you touch it, you fix it."

### 3. TRANSACTION Mode (Guest Actions)

- **Usage**: Action methods (`reserve()`, `purchase()`).
- **Scope**:
  - **Enforces**: Structural Integrity + Inventory Invariants.
  - **Relaxes**: Business Rules.
- **Goal**: Solves "Legacy Data Lock-out". Guests can reserve an item with a legacy short name ("PS") without being blocked by business rule validation, as long as there is stock available.

### 4. STRUCTURAL Mode (Persistence & Transfers)

- **Usage**:
  - Hydration methods (`WishlistItem.reconstitute()`).
  - Restoration Logic (`cancelReservation()`, `cancelPurchase()`).
  - Move Logic (`moveToWishlist()`).
- **Scope**:
  - **Enforces**: **ONLY** Structural Integrity (Types, UUIDs, Non-negative integers).
  - **Relaxes**: Business Rules + Inventory Invariants.
- **Goal**: Trust the database. Ensure the application can always load existing data or move items between lists, even if they violate current rules or invariants.

## Consequences

### Positive

- **Schemaless Evolution**: We can safely increase business rule strictness (e.g., increase min price, min length) without running migration scripts on the DB or breaking guest flows.
- **Privacy Preservation**: Owners can reduce `totalQuantity` freely. The system tolerates the resulting "over-committed" state (`EVOLUTIVE` mode) and persists it (`RECONSTITUTE` mode).
- **Robustness**: The application is resilient to "bad" legacy data, crashing only on actual data corruption (Structural failure).

### Negative

- **Complexity**: Domain entities must manage validation contexts (`ValidationMode`) passed down to their internal validator.
- **Inconsistency**: It is possible to have "invalid" data (by current standards) live in the system and be transactable. This is an explicit trade-off for usability and backward compatibility.
