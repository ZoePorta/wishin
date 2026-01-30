# ADR 003: Monorepo Organizational Strategy

## Status

Accepted

## Context

Wishin consists of a mobile app, potential shared types, and cloud functions. Managing multiple repositories increases synchronization friction.

## Decision

We will adopt a **Monorepo** structure.

## Consequences

- **Shared Code:** Easier sharing of TypeScript interfaces between the frontend and backend functions.
- **Tooling:** Requires a clear directory structure (e.g., `apps/`, `packages/`) to manage different build contexts.
