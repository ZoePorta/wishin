# Contributing to Wishin

Welcome to the Wishin project! We're excited to have you on board. As a senior developer or architect, we expect high standards for code quality and architectural integrity.

## Development Workflow

We follow a strict **TDD (Test-Driven Development)** workflow. No production code should be written without a preceding failing test.

### Branching Strategy

- **`main`**: The stable branch. Directly represents the production-ready state.
- **Feature Branches**: Create branches from `main` using the format `feature/your-feature-name`.
- **Bug Fixes**: Use `fix/issue-description`.

### Pull Request Requirements

Before submitting a PR, ensure:

1.  All tests pass (`pnpm test`).
2.  The code follows the project's styling and linting rules (`pnpm lint`).
3.  Type checks pass (`pnpm type-check`).
4.  Documentation is updated (including JSDoc for new public methods).
5.  If a significant architectural change is made, an **ADR** is created in `docs/adr/`.

## Coding Standards

### Clean Architecture & DDD

- Maintain strict isolation between Domain, Application, and Infrastructure layers.
- Avoid leaking infrastructure details (like Appwrite SDK) into the Domain.

### UI Standards (Material Design 3)

- Use `react-native-paper` components.
- Use the `useTheme()` hook for all colors and typography.

### Security

- Always follow "Security by Design".
- Ensure capability-based access for guests and proper identity-based access for registered users.

## Commits

We use **Conventional Commits**. Every commit message must follow the spec:
`<type>[optional scope]: <description>`

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

## Getting Help

If you have questions, please reach out to the technical leads or open an issue for discussion.
