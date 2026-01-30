# ADR 002: Architectural Patterns and Decoupling

## Status

Accepted

## Context

To ensure testability and mitigate the risks identified in ADR 001, we need a robust architectural framework.

## Decision

We will implement **Clean Architecture** principles using **Domain-Driven Design (DDD)**.

- **Repository Pattern:** To abstract data access.
- **Adapter Pattern:** To wrap the Appwrite SDK.

## Consequences

- **Testability:** Domain logic can be tested in isolation using Jest and Mocks.
- **Complexity:** Higher initial boilerplate for simple CRUD operations. This is accepted as a trade-off for long-term maintainability.
