# 10. Wishlist Privacy and Access Control

Date: 2026-02-09

## Status

Amended by ADR 011

## Context

Privacy and security of user wishlists are paramount to preventing unauthorized access and "trolling" (e.g., malicious users marking items as purchased).
Originally, the system proposed using "slugs" for wishlist URLs (e.g., `wishin.app/username/my-list`) and planned for public profiles in earlier phases.
However, slugs are easily guessable, which increases the attack surface for unauthorized access.
Additionally, full public profiles pose privacy concerns that need more careful implementation, warranting a delay in their release.

## Business Drivers

- **Security:** Minimizing the risk of unauthorized users guessing wishlist URLs.
- **Privacy:** ensuring users have control over who sees their lists and profiles.
- **Phased Delivery:** Focusing on core secure sharing features before broader social discovery.

## Decision

We will adopt a security-first approach to wishlist access and visibility.

### 1. UUIDs for URLs (No Slugs)

- Wishlist URLs will use **UUIDs** (e.g., `wishin.app/lists/550e8400-e29b-41d4-a716-446655440000`) instead of human-readable slugs.
- This makes URLs practically impossible to guess, significantly reducing the risk of unauthorized access by strangers.
- The `slug` field will be removed from the `Wishlist` domain entity.

### 2. Profile Visibility & Timeline

- **Public Profiles** are delayed to the **Moonshot Initiatives** phase.
- In the future, profiles will only be visible to **confirmed contacts** (mutual connection), not the general public by default.

### 3. Wishlist Access & Participation Model

We distinguish between **Visibility** (who can see) and **Participation** (who can act/buy).

#### A. Visibility (View Access)

- **Levels:**
  - **Link (Public via UUID):** Accessible by anyone with the UUID logic.
  - **Private (Invite Only):** Accessible only to the owner and explicitly invited users.
- **Default:** Link (for MVP). Public Profiles will respect this setting (hiding Private lists).

#### B. Participation (Action Access)

- Controls who can perform `reserve` or `purchase` actions on a visible list.
- **Levels:**
  - **Anyone:** Anonymous guests and registered users (Default for simple sharing).
  - **Registered:** Must be logged in to act.
  - **Contacts:** Must be a confirmed contact of the owner.
  - _(Private lists imply "Invitees Only" implicitly)_.

#### Summary

| Visibility  | Participation Mode | Behavior                                                 |
| :---------- | :----------------- | :------------------------------------------------------- |
| **Link**    | **Anyone**         | Public URL, Guests can buy (Mother Factor).              |
| **Link**    | **Registered**     | Public URL, but must login to buy.                       |
| **Link**    | **Contacts**       | Public URL, but only friends can buy.                    |
| **Private** | _(Implied)_        | URL returns 404 for non-invitees. Only invitees can buy. |

### 4. Domain Preparedness

- The Domain Layer must be designed to support these access controls (scopes, invitations, UUID-based lookup) from the start, even if the UI/API exposure comes in later phases.

## Consequences

### Positive

- **Enhanced Security:** Guessing URLs is computationally infeasible.
- **Better Privacy:** Users have tighter control over visibility; no "accidental" public exposure via guessable slugs.
- **Simplified Domain:** Removing the uniqueness constraint and management overhead of slugs simplifies the initial domain model.

### Negative

- **Less Pretty URLs:** UUIDs are long and ugly compared to `username/list-name`.
- **Harder to Type:** Users must rely on copy-pasting links; manually typing a URL is not practical.

### Compliance

- API endpoints for retrieving wishlists must accept UUIDs.
- `Wishlist` entity must explicitly support `visibility` and `participation` attributes.
- `Wishlist` entity logic must validate access based on the current user context (auth/guest) using `visibility` and `participation` rules.
