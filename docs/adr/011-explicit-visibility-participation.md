# 11. Explicit Visibility and Participation

Date: 2026-02-10

## Status

Accepted

## Context

The `Wishlist` aggregate currently defaults `visibility` to `LINK` and `participation` to `ANYONE` when created. As highlighted by security analysis (Coderabbit), defaulting to `LINK/ANYONE` violates the principle of "Secure by Default". If a UUID leaks, a newly created wishlist could become publicly viewable and actionable without the user's explicit intent.

## Decision

We will remove the default values for `visibility` and `participation` in the `Wishlist.create` factory method.
The use case layer (application service) must explicitly provide these values when creating a wishlist.

## Consequences

### Positive

- **Secure by Default**: No accidental public wishlists.
- **Explicit over Implicit**: The code creating the wishlist is self-documenting regarding security settings.
- **Domain Agnosticism**: The domain entity doesn't assume a "default" business product policy; it just validates what it's given.

### Negative

- **Breaking Change**: All existing calls to `Wishlist.create` must be updated to supply these arguments.
