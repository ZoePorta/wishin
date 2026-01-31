# ADR 003: Monorepo Organizational Strategy

## Status

Accepted

## Context

Wishin consists of a mobile app, potential shared types, and cloud functions. Managing multiple repositories increases synchronization friction.

## Decision

We will adopt a **Monorepo** structure, using **pnpm** as the package manager.

## Rationale for pnpm

- **Dependency Integrity:** pnpm uses a content-addressable store and strict node_modules structure, preventing phantom dependencies and ensuring consistent environments.
- **Performance:** Efficient disk space usage and faster installation times compared to npm/yarn.
- **Support:** Native support for workspaces via `pnpm-workspace.yaml`.

## Consequences

- **Shared Code:** Easier sharing of TypeScript interfaces between the frontend and backend functions.
- **Tooling:** Requires a clear directory structure (e.g., `apps/`, `packages/`) to manage different build contexts.
