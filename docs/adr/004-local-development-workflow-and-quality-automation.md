# ADR 004: Local Development Workflow and Quality Automation

## Status

Accepted

## Context

Manual enforcement of coding standards (linting, formatting, commit naming) is error-prone and increases the cognitive load on the developer. We need to catch errors before they reach the CI pipeline.

## Decision

We will implement a local automation layer using:

- **Husky:** For Git hooks management.
- **lint-staged:** To run linters and tests only on changed files.
- **commitlint:** To enforce the Conventional Commits specification.

## Consequences

- **Preventative Quality:** Errors are caught locally, reducing CI/CD billable minutes and failed PRs.
- **Workflow Friction:** Commits and pushes may take a few seconds longer as they trigger automated checks.
- **Discipline:** Developers are forced to fix linting and test issues immediately.
