# ADR 029: Automated Lockfile Synchronization

## Status

Proposed

## Context

The `pnpm-lock.yaml` file frequently goes out of sync with `package.json` when dependencies are added or updated manually, or when `pnpm install` is not run locally before committing. This causes `pnpm install --frozen-lockfile` to fail in CI, blocking development and requiring manual intervention.

## Decision

We will automate the synchronization of the lockfile at two levels:

1.  **Local (Pre-commit)**: Add a `lint-staged` rule to `package.json` that runs `pnpm install --lockfile-only` and stages the resulting `pnpm-lock.yaml` whenever `package.json` is modified.
2.  **CI (GitHub Actions)**: Add a fallback step in the CI workflow that detects lockfile mismatches, updates the lockfile, and automatically commits it back to the branch with a `[skip ci]` flag.

## Consequences

- **Positive**:
  - Developers no longer need to manually fix lockfile issues in CI.
  - The repository stays healthy by design.
  - Faster feedback loop for PRs.
- **Negative**:
  - Increased complexity in CI configuration.
  - Potential for unexpected automated commits if not monitored.

## Amends

- ADR 004: Local development workflow and quality automation.
