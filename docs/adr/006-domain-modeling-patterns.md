# ADR 006: Domain Modeling Patterns

## Status

Accepted

## Context

We are building the `WishlistItem` entity as the core of the Wishin domain. To ensure high data integrity, clear lifecycle management, and robust inventory control, we need to establish consistent modeling patterns.

Additionally, the application supports two distinct "undo" workflows that heavily influence the domain logic:

1.  **Grace Period**: All users (anonymous or registered) have a brief window after "buying" an item to undo the action. During this time, the item is technically _reserved_, not _purchased_.
2.  **Post-Purchase Cancellation**: Registered users can cancel a completed purchase from their history, returning the item to stock.

## Decision

We will apply the following patterns to our Domain Entities:

### 1. Factory Pattern for Instantiation

- **Constructors are private**. This prevents partial or invalid state creation.
- **Static `create` methods** are the only entry point. They handle sanitization (e.g., trimming strings) and strictly enforce initial validation rules before an object is born.

### 2. Strict Immutability

- All properties are `readonly`.
- State-changing methods (e.g., `reserve`, `purchase`) **must return a new instance** of the class rather than modifying `this`.
- **Internal `toProps` helper**: We use a private `toProps()` method to extract the current state. This simplifies strict immutability by allowing cleaner "copy-with-change" logic (e.g., `new Entity({ ...this.toProps(), ...changes })`) and ensures no property is accidentally missed during cloning.
- This ensures predictable state flow and simplifies change tracking in the UI.

### 3. Entity Equality by Identity

- Equality checks (`equals(other)`) are based solely on the unique `id` (UUID), adhering to DDD Entity principles.
- Two instances with different property values but the same `id` represent the same entity in different states.

### 4. Encapsulated Inventory Logic

- Stock management logic resides **inside the entity**, not in services.
- This protects invariants (e.g., `reserved + purchased <= total`) at the lowest level.

### 5. Reservation and Purchase Workflows

The domain exposes operations that support both explicit user intent and technical requirements like the "Grace Period":

- **Reservation (`reserve`)**: Used in two contexts:
  1.  **Explicit Reservation**: Registered users can explicitly reserve an item.
  2.  **Grace Period (Technical)**: When any user "buys" an item, it is first _reserved_ during the grace period. This prevents race conditions (locking stock) and allows the user to "undo" the action before finalization.
- **Cancellation of Reservation (`cancelReservation`)**: Cancels either an explicit reservation or a grace-period undo.
- **Purchase (`purchase`)**: Finalizes the transaction, typically consuming the reserved stock after the grace period expires.
- **Cancellation of Purchase (`cancelPurchase`)**: Used for "Post-Purchase Cancellation" (returns to stock).

## Consequences

- **Testability**: Purely domain-based logic is easy to unit test without mocking databases.
- **Safety**: It is impossible to instantiate an invalid entity or transition to an illegal state (e.g., negative stock).
- **Clarity**: The distinction between `cancelReservation` and `cancelPurchase` makes the intent of the "undo" action explicit in the code, mirroring the business rules.
