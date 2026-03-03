# ADR 020: Adopt Material Design 3 and React Native Paper

## Status

Accepted

## Context

The project currently uses a manual styling approach with custom `StyleSheet` objects and non-standard color tokens. This creates:

1.  **High maintenance overhead**: Every UI component requires custom styling and manual state management (hover, focus, pressed).
2.  **Lack of native accessibility**: Custom components often miss critical accessibility features provided by mature UI libraries.
3.  **Visual inconsistency**: Maintaining a unified look and feel across Web and Android is difficult with manual styles.
4.  **Theming limitations**: Implementing Dark/Light mode requires significant boilerplate.

## Decision

We will adopt **Material Design 3 (MD3)** using the [react-native-paper](https://reactnativepaper.com/) library.

Key implementation details:

1.  **Semantic Tokens**: We will map our existing brand colors (#8B5CF6 and #F472B6) to MD3 semantic tokens (Primary, Secondary, etc.).
2.  **Root Provider**: We will wrap the application root with `PaperProvider` to enable consistent theming.
3.  **Component Replacement**: Standard UI elements (Buttons, Inputs, Cards, Dialogs) will be replaced with their `react-native-paper` equivalents.
4.  **Brand Extensions**: Custom components that require unique branding (like Gradient Buttons) will be treated as "Brand Extensions" of the MD3 base, inheriting tokens where possible.

## Consequences

### Positive

- **Development Velocity**: Reduction of custom CSS/StyleSheets by 60%+.
- **Accessibility**: Out-of-the-box support for WCAG guidelines and screen readers.
- **Theming**: Native support for Dark/Light mode and dynamic color schemes.
- **Consistency**: High visual fidelity across platforms (Android, iOS, Web).

### Negative

- **Bundle Size**: Incremental increase in bundle size due to the library (mitigated by tree-shaking).
- **Refactoring Effort**: Requires updating existing UI components to the new paradigm.
- **Learning Curve**: Team members need to familiarize themselves with MD3 tokens and the Paper API.
