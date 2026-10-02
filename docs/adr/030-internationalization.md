# ADR 030: Internationalization (i18n) of the Client UI

## Status

Accepted

## Context

All user-facing text in `@wishin/expo-client` was hardcoded in English, spread across components, hooks, alerts and the static landing page (`public/landing-content.html`). We want to serve Spanish-speaking users too, starting with English and Spanish, and pick the language automatically from the device/browser.

Two existing patterns made this harder than a plain string swap:

- Forms decided which field to highlight by searching the **displayed error message** for words like `"name"` or `"short"` (`matchesError`). That breaks as soon as the message is translated.
- Several screens displayed raw `error.message` values coming from the domain or the Appwrite SDK, which are technical and always in English.

## Decision

1. **Libraries**: `i18next` + `react-i18next` for translation, `expo-localization` for detecting the preferred languages on native and web.
2. **Resources**: translations live in `apps/expo-client/src/i18n/locales/*.ts` and are bundled statically, so i18next initializes synchronously before the first render. `en.ts` is the source of truth; other locales are typed as `TranslationResource` (same keys, string values), so missing or extra keys fail type-checking. A module augmentation (`i18next.d.ts`) types `t()` keys against `en`.
3. **Detection**: `resolveLanguage()` picks the first supported language from the user's ordered preferences, falling back to English. `useDeviceLanguageSync()` (in the root layout) re-applies it when the system language changes at runtime and mirrors it into `<html lang>` on web. There is no in-app language picker yet.
4. **Usage**: components and hooks use `useTranslation()`. Code outside the React render cycle (e.g. the OAuth callback in `CoreProvider`) uses the exported `i18n` instance. Pure helpers receive a `TFunction` so they stay testable with `createI18n(lng)`, which has no native dependencies.
5. **Errors are classified, not matched by text**: `classifyError()` maps domain/SDK errors to a language-agnostic `ErrorKind`; forms keep the kind in state and translate it at render time. Auth failures go through `getAuthErrorMessage()` / `getOAuthErrorMessage()`, which translate known cases (existing account, invalid credentials, OAuth failure reasons, network) and hide everything else behind a generic message. Email and password failures (wrong credentials or invalid format) share a single "invalid credentials" message so the UI never reveals which field was wrong. Raw backend messages are no longer shown to users.
6. **Formatting**: prices use i18next's built-in `number` formatter (`Intl.NumberFormat`) so decimals, grouping and symbol position follow the language (`€ 1,234.50` vs `1234,50 €`).
7. **Landing iframe**: the app passes the resolved language to `landing-content.html` as a `lang` query param; the page keeps English in its markup and swaps `data-i18n` / `data-i18n-alt` elements from an inline dictionary.
8. **Domain stays untouched**: domain and infrastructure error messages remain technical English strings; translation is purely a UI concern.

## Consequences

- **Positive**:
  - Adding a language means adding one locale file (plus the landing dictionary); type-checking and `resources.spec.ts` catch missing keys and mismatched interpolation variables.
  - Form error highlighting no longer depends on the wording of messages.
  - Users no longer see raw technical/SDK error messages.
- **Negative**:
  - The landing page translations live in a separate inline dictionary and are not covered by the typed resources.
  - Native permission prompts (iOS `Info.plist` strings) are still English only.
  - Interpolation variables must not be named after `Intl.NumberFormat` options (e.g. `currency`), because i18next forwards them to the formatter.
