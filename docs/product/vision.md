# Product Vision: Wishin

> **Vision Statement:** > Wishin is a gifting synchronization platform designed to eliminate the friction of registration and the disappointment of duplicate gifts. It bridges the gap between tech-savvy users and those who value simplicity, ensuring that every gift is a surprise and no one buys the same thing twice.

---

## 1. The Core Problem (The "Mother Factor")

Traditional gifting lists often fail due to two main barriers:

1. **Registration Friction:** Users (especially older or non-technical demographics) abandon the app when forced to create an account just to view or buy a gift.
2. **Synchronization Failure:** Without a real-time, shared inventory, duplicate gifts occur, ruining the surprise and causing logistical headaches.

---

## 2. Roadmap & Feature Tiers

| Category         | **MVP (Phase 1)**                             | **Full Version (Phase 2)**                                   | **Moonshot Initiatives**                                                      |
| :--------------- | :-------------------------------------------- | :----------------------------------------------------------- | :---------------------------------------------------------------------------- |
| **Wishlists**    | 1 list per user. Single owner. Max 100 items. | Multiple lists. Collaborative editing (e.g., Wedding lists). | Conditional/Linked gifts (e.g., Set of brushes locked until Easel is bought). |
| **Access**       | Unique URL (Slug-based).                      | Public profile + URL.                                        | Private lists (Invite-only/Explicit permission).                              |
| **Users**        | Anonymous Guest support for Purchase/Reserve. | Public profiles.                                             | Friend system (Contact lists integration).                                    |
| **Inventory**    | Order by Priority. Basic Stock Management.    | Custom sorting (Price, Amount). Hide out-of-stock toggle.    | "Add to my list" (Clone items between users).                                 |
| **Reservations** | Unlimited duration.                           | Fixed expiration time.                                       | Admin-configurable expiration.                                                |
| **Gamification** | -                                             | -                                                            | Badges (Top Gifter, Big Spender, Creator).                                    |

---

## 3. User Roles & Permissions

### A. The Owner (Administrator)

- **Goal:** Create and manage their own desires.
- **Privacy:** Can update attributes but **cannot see** who reserved/purchased items (Surprise factor).
- **Control:** Can prune reservations by reducing `totalQuantity` (Inventory Pruning).

### B. The Collaborator (Registered User)

- **Goal:** Track their gifting activity across multiple friends.
- **Benefits:** Access to a "My Gifting" dashboard to manage active reservations and history.

### C. The Guest (Anonymous)

- **Goal:** Zero-friction interaction.
- **Session:** Uses `sessionID` for a "grace period" to undo accidental actions.
- **Constraints:** Cannot manage a long-term history once the session/cache is cleared.

---

## 4. Key Business Logic

### Inventory Privacy Asymmetry

The system maintains two views of the same data:

- **Public View:** Shows real availability ($Q_{available}$).
- **Owner View:** Shows intended quantities ($Q_{total}$). Changes here trigger automatic "pruning" of reservations to maintain a valid (though potentially over-committed) state without revealing spoilers.

### The "Grace Period" Flow

Anonymous actions are treated as **temporary locks**.

1. Guest clicks "Purchase".
2. Item is marked as reserved/purchased via `sessionID`.
3. An "Undo" button is available for X hours.
4. After the window closes, the action is consolidated.
