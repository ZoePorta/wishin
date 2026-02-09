# 10. Wishlist Privacy and Access Control

Date: 2026-02-09

## Status

Accepted

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

### 3. Wishlist Access Model

- **Access Methods:** Users can access wishlists via the direct UUID URL or through the user's profile (when available/authorized).
- **Private Lists (Final Phase):**
  - Creators can invite specific friends to private lists.
  - Invited friends will see these lists on the creator's profile (hidden to others).
  - Uninvited users accessing the URL will receive a 404 (Not Found) error to mask the existence of the resource (Privacy by Design).
  - Invitations can be revoked.
- **Scope Definition (Phase 2):**
  - List creators will be able to define the **Scope** of who can buy/reserve items:
    - **Public:** Anyone with the link (including anonymous guests).
    - **Registered:** Only logged-in users.
    - **Contacts:** Only confirmed friends (when implemented).

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
- `Wishlist` entity must support a `scope` (or similar) attribute for future access control usage.
- `Wishlist` entity logic must handle validation of access based on current user context (auth/guest).
