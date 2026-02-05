# Wishin

## Vision

Wishin is a high-performance, real-time collaborative platform designed for frictionless gift coordination. By combining a hybrid access model with an atomic inventory system, Wishin ensures that wishlists remain accurate and synchronized, whether contributors are registered members or anonymous guests.

## Core Functionality

- **Hybrid Participation Model:** Optimized for zero-friction; anonymous guests can mark items as "purchased" via unique sharing URLs, while registered users gain access to a "reservation" phase.
- **Two-Stage Item Commitment:** A robust lifecycle management system with distinct states: `Available`, `Reserved` (temporary lock), and `Purchased` (final state).
- **Atomic Inventory Control:** A synchronization engine that manages item quantities (including unlimited status) via server-side atomic operations to ensure data integrity.
- **Real-Time State Updates:** Instant broadcast of status changes across all clients via Appwrite Realtime (WebSockets).

## Technical Stack

| Layer              | Technology                                  |
| :----------------- | :------------------------------------------ |
| **Frontend**       | Expo (React Native) + TypeScript            |
| **Backend (BaaS)** | Appwrite Cloud                              |
| **Testing Suite**  | Vitest & React Native Testing Library       |
| **E2E Testing**    | Maestro (Mobile) & Playwright (Web)         |
| **Observability**  | Sentry (Errors) & PostHog (Analytics)       |
| **AI Governance**  | CodeRabbit (Automated Architectural Review) |

## Quality Gates & Engineering Standards

### 🛡️ Security & Privacy

- **Security by Design:** Implementation of link-based authorization (Capability-based Security) for guest access and identity-based access for registered users.
- **Security by Default:** All data structures are private. Access is granted only via explicit ownership or possession of a secure, cryptographically signed sharing token.

### 🧪 Testing & Reliability

- **TDD Discipline:** Strict adherence to the Red-Green-Refactor workflow. No production code is implemented without a preceding failing test.
- **Test Coverage:** Mandatory minimum threshold of **80% coverage** for Domain and Application layers.
- **Concurrency Management:** Engineered to handle race conditions between guest purchases and member reservations using atomic database operations.

### 🏗️ Architecture

- **Clean Architecture:** Strict separation of concerns using Domain-Driven Design (DDD).
- **Decoupled Infrastructure:** Implementation of the **Repository and Adapter Patterns** to isolate the business logic from the Appwrite SDK.
- **Strict Type Safety:** Comprehensive TypeScript enforcement (`no-explicit-any`) across the entire stack to catch errors at compile time.

### 🛠️ Development Workflow & Automation

- **Pre-commit Hooks (Husky + lint-staged):** Automated execution of ESLint (including security plugins), Prettier, and Unit Tests on staged files to prevent regression.
- **Commit Validation (Commitlint):** Strict enforcement of the [Conventional Commits specification](https://www.conventionalcommits.org/) at the Git level to ensure transparent version history.
- **Pre-push Checks:** Final local validation of the full test suite before remote synchronization.

### 🤖 AI Governance & Observability

- **Automated AI Review:** Integration of CodeRabbit to enforce architectural constraints and identify logical edge cases in every Pull Request.
- **Real-time Telemetry:** Full visibility into system health and user behavior via Sentry and PostHog.

## Architectural Decision Records (ADR)

- [ADR 001: BaaS Infrastructure Alignment](docs/adr/001-baas-infrastructure-alignment.md)
- [ADR 002: Architectural Patterns and Decoupling](docs/adr/002-architectural-patterns-and-decoupling.md)
- [ADR 003: Monorepo Organizational Strategy](docs/adr/003-monorepo-organizational-strategy.md)
- [ADR 004: Local Development Workflow and Quality Automation](docs/adr/004-local-development-workflow-and-quality-automation.md)
- [ADR 005: Adopt Vitest for Testing](docs/adr/005-adopt-vitest-for-testing.md)

## License

Licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
