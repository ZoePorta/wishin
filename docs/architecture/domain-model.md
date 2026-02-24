# Domain Model: Wishin

## 1. Entity Overview & Relationships

The Wishin domain is structured around a central aggregate root: the **Wishlist**. The following diagram illustrates how actors interact with the domain entities.

```mermaid
classDiagram
    class User {
        +string id
        +string email
        +string username
        +string? imageUrl
        +string? bio
    }

    class Wishlist {
        +string id
        +string ownerId
        +string title
        +WishlistVisibility visibility
        +WishlistParticipation participation
        +string? description
        +List~WishlistItem~ items
    }

    class WishlistItem {
        +string id
        +string wishlistId
        +string name
        +string? description
        +Priority priority
        +number? price
        +string? currency
        +string? url
        +string? imageUrl
        +boolean isUnlimited
        +number totalQuantity
        +number reservedQuantity
        +number purchasedQuantity
    }

    note for WishlistItem "Invariant: When isUnlimited is true, reservedQuantity and purchasedQuantity ARE tracked<br/>to measure engagement, but the constraint (total >= reserved + purchased) is ignored.<br/>This constitutes a 'soft' constraint for analytics purposes."

    class Transaction {
        +string id
        +string itemId
        +string userId?
        +TransactionStatus status
        +number quantity
        +Date createdAt
        +Date updatedAt
    }

    note for Transaction "States: RESERVED, PURCHASED, CANCELLED"

    User "1" -- "0..*" Wishlist : owns
    Wishlist "1" *-- "0..100" WishlistItem : contains
    User "0..1" -- "0..*" Transaction : performs
    Transaction "*" -- "1" WishlistItem : targets
```

## 2. Validation Strategy: The Tiered Approach

To solve the **"Mother Factor"** (allowing non-technical guests to interact with legacy data) and preserve **Owner Privacy**, we use a tiered validation system.

### 2.1 Validation Matrix

| Mode            | Context                                                        | Structural | Business Rules | Inventory Invariants |
| :-------------- | :------------------------------------------------------------- | :--------: | :------------: | :------------------: |
| **STRICT**      | `create()`                                                     | ✅ Always  |  ✅ Mandatory  |     ✅ Enforced      |
| **EVOLUTIVE**   | `update()`                                                     | ✅ Always  |  ✅ Mandatory  | ❌ Relaxed (Privacy) |
| **TRANSACTION** | `createReservation()`, `createPurchase()`, `confirmPurchase()` | ✅ Always  |  ❌ Bypassed   |    ✅ Enforced\*     |
| **STRUCTURAL**  | Persistence/DB                                                 | ✅ Always  |  ❌ Bypassed   |     ❌ Bypassed      |

> (\*) **Note:** For `isUnlimited` items, Inventory Invariants are ignored during transactions (availability is infinite).

## 3. Validation Flow

The following sequence shows how different actions trigger different validation logic within the same entity.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> ValidationMode

    state ValidationMode {
        direction TB
        STRICT --> Structural
        STRICT --> Business
        STRICT --> Inventory

        EVOLUTIVE --> Structural
        EVOLUTIVE --> Business

        TRANSACTION --> Structural
        TRANSACTION --> Inventory

        STRUCTURAL --> Structural
    }

    Structural: UUIDs & Basic Types
    Business: Name Length, URL Formats, Price range
    Inventory: Total >= Reserved + Purchased (Ignored if isUnlimited)


```

## 4. Key Domain Logic

### 4.1 Inventory Calculations

The entity calculates availability in real-time to prevent over-subscription during transactions:

$$
Q_{available} =
\begin{cases}
\infty & \text{if } isUnlimited \\
\max(0, Q_{total} - (Q_{reserved} + Q_{purchased})) & \text{otherwise}
\end{cases}
$$

### 4.2 Reservation Pruning

When an owner reduces the `totalQuantity`, the system automatically "prunes" existing reservations to stay as close to a valid state as possible without affecting already purchased items:

$$Q_{newReserved} = \min(Q_{currentReserved}, \max(0, Q_{newTotal} - Q_{purchased}))$$

### 4.3 Privacy Preservation (Over-commitment)

In `EVOLUTIVE` mode, the system allows states where:

$$Q_{total} < Q_{reserved} + Q_{purchased}$$

This prevents the owner from discovering "secret" purchases when they try to lower the item's total quantity, maintaining the surprise factor.

### 4.4 The "Grace Period" Flow (Client-Side Undo)

To minimize friction while maintaining data integrity, anonymous actions are handled as **immediate commitments with a volatile undo window**.

1. **Immediate Action:** When a Guest clicks "Purchase", the `Transaction` is created in the appropriate state (`PURCHASED`) and stock is updated.
2. **Volatile Window:** A UI popup with a countdown appears.
3. **Undo (Deletion):** If the Guest clicks "Undo" before the countdown ends or before navigating away, the `Transaction` is **hard-deleted** from the system, effectively restoring stock.
4. **Finality:** Once the user leaves the page or the window closes, the transaction is considered permanent for that session.

---

### 4.5 Cancellation vs. Undo

- **Undo:** Available to everyone on Purchase. Deletes the transaction record. Only available immediately after the action.
- **Cancellation:** Available to both **Registered** and **Anonymous** users (via ADR 018) via their "Gifting History", **restricted to their own transactions**. It transitions the transaction to a `CANCELLED` status (Soft Delete) for audit purposes.

## 5. Domain Invariants & Lifecycle

1.  **Identity Immutability:** An item's `id` cannot be changed after creation.
2.  **Atomic State Transitions:** All changes to domain aggregates (e.g., `WishlistItem`, `Transaction`) result in a new immutable instance.
3.  **Transaction Identity Invariant:** Every `Transaction` MUST have a `userId`. The distinction between anonymous and registered users is handled at the Infrastructure/Authentication layer.
4.  **Transaction Lifecycle:**
    - **Undo:** A hard delete of the `Transaction` record, triggered only during the active UI session.
    - **Cancellation:** A status update (`status: CANCELLED`) which triggers a stock restock in the target `WishlistItem`.
    - **Confirmation:** A status update from `RESERVED` to `PURCHASED`.
5.  **Role Isolation:** Anonymous users are restricted to `PURCHASED` transactions and `CANCELLED` status management. They cannot initiate `RESERVED` states or create lists (ADR 018).
