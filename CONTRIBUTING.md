# Contributing to Wishin

Thanks for your interest in Wishin! Bug reports, feedback, feature ideas and pull requests are all welcome.

- **Found a bug or have an idea?** Open a [GitHub Issue](https://github.com/ZoePorta/wishin/issues).
- **Want to send code?** For anything beyond a small fix, open an issue first so we can agree on the approach before you invest time in it.

## License and Contributor License Agreement

Wishin is source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE), and commercial licenses are offered separately. To keep that possible, every contributor must sign the [Contributor License Agreement](CLA.md) before a pull request can be merged. You keep the copyright of your work; the CLA grants the maintainer the right to distribute it under the project's licenses, including commercial ones.

The CLA bot will comment on your first pull request with a link to sign it. It only takes a minute and is needed once.

## Development Workflow

We follow a strict **TDD (Test-Driven Development)** workflow. No production code should be written without a preceding failing test.

### Branching Strategy

- **`main`**: production/release branch. It only receives merges from `develop`.
- **`develop`**: integration branch. **All pull requests must target `develop`.**
- **Feature branches**: fork the repository and branch from `develop` using `feature/your-feature-name`.
- **Bug fixes**: use `fix/issue-description`.

### Pull Request Requirements

Before submitting a PR, ensure:

1.  The PR targets `develop`, not `main`.
2.  All tests pass (`pnpm test`).
3.  The code follows the project's styling and linting rules (`pnpm lint`).
4.  Type checks pass (`pnpm type-check`).
5.  Documentation is updated (including JSDoc for new public methods).
6.  If a significant architectural change is made, an **ADR** is created in `docs/adr/` and linked in the README.
7.  Commits are **signed** (GPG, SSH or S/MIME). `develop` requires verified signatures; see [GitHub's guide on signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits).

## Coding Standards

### Clean Architecture & DDD

- Maintain strict isolation between Domain, Application, and Infrastructure layers.
- Avoid leaking infrastructure details (like Appwrite SDK) into the Domain.

### UI Standards (Material Design 3)

- Use `react-native-paper` components.
- Use the `useTheme()` hook for all colors and typography.

### Internationalization

- No hardcoded user-facing strings: use `useTranslation()` from `react-i18next`.
- Add every new key to both `src/i18n/locales/en.ts` and `es.ts`.

### Security

- Always follow "Security by Design".
- Ensure capability-based access for guests and proper identity-based access for registered users.

## Commits

We use **Conventional Commits**. Every commit message must follow the spec:
`<type>[optional scope]: <description>`

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

## Getting Help

If you have questions, open an issue for discussion.
