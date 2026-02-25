# Product Vision: Wishin

> **Vision Statement:** Wishin is a gifting synchronization platform designed to eliminate the friction of registration and the disappointment of duplicate gifts. It bridges the gap between tech-savvy users and those who value simplicity, ensuring that every gift is a surprise and no one buys the same thing twice.

---

## 1. The Core Problem (The "Mother Factor")

Traditional gifting lists often fail due to two main barriers:

1. **Registration Friction:** Users (especially older or non-technical demographics) abandon the app when forced to create an account just to view or buy a gift.
2. **Synchronization Failure:** Without a real-time, shared inventory, duplicate gifts occur, ruining the surprise and causing logistical headaches.

### 1.1 The "Mother Factor" Scenario (Zero-Friction Design)

The "Mother Factor" is the guiding design principle of Wishin. It recognizes that the most critical users (gift-buyers) often face the highest technological barriers.

- **Actor:** Maria (Non-technical Guest user).
- **The Situation:** Maria receives a link to her son's birthday list. She wants to buy a "Mechanical Keyboard" but is wary of apps that require sign-ups, passwords, or complex flows.
- **The Flow:** 1. Maria clicks the link and immediately sees the list. 2. She clicks "Purchase" on the keyboard. 3. The system locks the item using a first-class **Anonymous Session** (ADR 018).
- **The Result:** Maria completes her purchase. Because she has a persistent anonymous identity, she can return later to see her purchase history or even cancel the purchase if she changes her mind, all without ever seeing a registration screen.

---

## 2. Roadmap & Feature Tiers

| Category         | **MVP (Phase 1)**                             | **Full Version (Phase 2)**                                   | **Moonshot Initiatives**                                                      |
| :--------------- | :-------------------------------------------- | :----------------------------------------------------------- | :---------------------------------------------------------------------------- |
| **Wishlists**    | 1 list per user. Single owner. Max 100 items. | Multiple lists. Collaborative editing (e.g., Wedding lists). | Conditional/Linked gifts (e.g., set of brushes locked until Easel is bought). |
| **Access**       | Unique URL (UUID-based).                      | Scope Control (Public/Registered/Contacts).                  | Public Profiles & Private Lists (Invite-only).                                |
| **Users**        | Anonymous Guest support for Purchase/Reserve. | Registered User Profiles (Private view).                     | Public Profiles & Friend system.                                              |
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

- **Goal:** Zero-friction interaction with first-class history.
- **Session:** Uses an **Appwrite Anonymous Session** (ADR 018).
- **Benefits:** Access to a persistent "My Gifting" history on the same device. Can cancel purchases.
- **Evolution:** Can "Upgrade" to a full account at any time, preserving all data.
- **Constraints:** Cannot create or manage wishlists; cannot reserve items (Purchase only).

---

## 4. Key Business Logic

### Inventory Privacy Asymmetry

The system maintains two views of the same data:

- **Public View:** Shows real availability ($Q_{available}$).
- **Owner View:** Shows intended quantities ($Q_{total}$). Changes here trigger automatic "pruning" of reservations. To maintain the surprise, the system explicitly supports an over-committed state, ensuring that reducing the total quantity does not expose hidden purchases.

### The "Undo" Window (Accidental Click Protection)

Anonymous actions (Purchase) include a brief **safety window** to handle accidental interactions without complicating the domain state.

1. **Immediate Finality:** When a Guest clicks "Purchase", the domain entity is updated immediately to reflect the new stock levels.
2. **Short Grace Period:** The UI provides an "Undo" button (Snackbar/Toast) for **30 seconds**. This popup includes a "Dismiss" (X) button to confirm the action immediately.
3. **Rollback:** If "Undo" is clicked, the transaction is **hard-deleted**. If the window expires or is dismissed, the transaction is finalized. Guests lose the ability to undo once this volatile window closes.
4. **Rationale:** This short window minimizes the risk of inventory conflicts with Owner updates while providing the necessary UX safety net for non-technical users.

---

## 5. Out of Scope (Initial Phase)

To maintain focus on the core value proposition, the following features are explicitly excluded from the MVP:

- **Payment Processing:** Wishin tracks intent and status; it does not handle monetary transactions.
- **Global User Search:** Lists are accessed via direct links (UUIDs) or profiles (when available), not a global directory.
- **Real-time Social Feed:** No internal chat; communication happens through external channels.
