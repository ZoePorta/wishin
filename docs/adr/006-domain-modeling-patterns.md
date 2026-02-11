# ADR 006: Domain Modeling Patterns

## Status

Accepted
Amended by [ADR 007](007-validation-modes.md) and [ADR 008](008-explicit-cancellation-flow.md)

## Context

We are building the `WishlistItem` entity as the core of the Wishin domain. To ensure high data integrity, clear lifecycle management, and robust inventory control, we need to establish consistent modeling patterns.

Additionally, the application supports two distinct "undo" workflows that heavily influence the domain logic:

1.  **Grace Period**: All users (anonymous or registered) have a brief window after "buying" an item to undo the action. This is modeled as an **Immediate Purchase** with a temporary "Undo" capability (rollback), ensuring the item is securely locked (sold) from the moment of interaction.
2.  **Post-Purchase Cancellation**: Registered users can cancel a completed purchase from their history, returning the item to stock (functionally identical to the Grace Period undo).

## Decision

We will apply the following patterns to our Domain Entities:

### 1. Factory Pattern for Instantiation

- **Constructors are private**. This prevents partial or invalid state creation.
- **Static `create` methods** are the only entry point. They handle sanitization (e.g., trimming strings) and strictly enforce initial validation rules before an object is born.

### 2. Strict Immutability

- **Private State, Public Access**: State is stored in a `private readonly props` object. Public access is provided via getters.
- **State-Changing Methods**: Methods like `reserve` or `purchase` **must return a new instance** of the class, created via the factory method or internal constructor, passing the modified props.
- **Public `toProps` Helper**: We use a public `toProps()` method to return a shallow copy of the current state (`{ ...this.props }`). This creates a clean DTO for usage outside the entity (e.g., in repositories or tests) and simplifies cloning logic (`new Entity({ ...this.toProps(), ...changes })`).

### 3. Entity Equality by Identity

- Equality checks (`equals(other)`) are based solely on the unique `id` (UUID), adhering to DDD Entity principles.
- Two instances with different property values but the same `id` represent the same entity in different states.

### 4. Encapsulated Inventory Logic

- Stock management logic resides **inside the entity**, not in services.
- **Strict Invariants**: Generally, `reserved + purchased <= total`.
- **Privacy Exception (Relaxed Invariant)**: To preserve user privacy, if an owner reduces `totalQuantity` below the committed amount (`reserved + purchased`), the system **allows** this "over-committed" state rather than leaking information about secret purchases.
- **Reservation Pruning**: When `totalQuantity` is reduced, the system automatically prunes `reservedQuantity` (prioritizing `purchasedQuantity` which is immutable) to minimize over-commitment.
- **Reconstitution**: We use a `reconstitute()` static method to bypass validation when restoring objects from persistence, handling potential valid over-committed states.

### 5. Reservation and Purchase Workflows

The domain exposes operations that support both explicit user intent and technical requirements like the "Grace Period":

- **Reservation (`reserve`)**: Used regarding **Explicit Reservation** where registered users intend to buy the item later.
- **Cancellation of Reservation (`cancelReservation`)**: Cancels an explicit reservation.
- **Purchase (`purchase`)**: Used for the "Buy Now" flow. Updates the domain state immediately (with cancellation allowed during grace period or per post-purchase rules).
- **Cancellation of Purchase (`cancelPurchase`)**: Handles both the "Undo" action during the grace period and acceptable post-purchase cancellations, reverting the purchase and restoring stock.

## Consequences

- **Testability**: Purely domain-based logic is easy to unit test without mocking databases.
- **Safety**: Invalid states are prevented during `create`, `reserve`, and `purchase` (e.g., negative stock). Reconstitution and certain updates may bypass business/inventory validation to preserve legacy data access.
- **Clarity**: The distinction between `cancelReservation` and `cancelPurchase` makes the intent of the "undo" action explicit in the code, mirroring the business rules. The "Immediate Purchase" model simplifies the happy path by removing the need for background jobs to finalize reservations.
