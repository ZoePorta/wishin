# Wishin — Engineering Context

## Project Overview

Wishin is a wishlist management app (mobile + web). Users create wishlists, share them, and guests can purchase or reserve items. Stack: React Native/Expo for the client, Appwrite as the BaaS (auth, DB, storage, functions), all organized in a pnpm monorepo.

**Current status:** Auth (email/password + Google OAuth) is complete. The app is in late-MVP development.

---

## Monorepo Structure

```text
wishin/
├── apps/
│   └── expo-client/        @wishin/expo-client  — React Native + Expo Router (web + native)
├── packages/
│   ├── domain/             @wishin/domain        — Pure DDD logic (entities, use cases, repo interfaces)
│   ├── infrastructure/     @wishin/infrastructure — Appwrite SDK adapters
│   └── shared/             @wishin/shared         — Cross-package utilities
├── functions/
│   └── sync-item-stats/    — Appwrite cloud function
├── scripts/
│   ├── provision.ts        — Creates/migrates Appwrite collections
│   └── seed.ts             — Seeds dev data
└── docs/
    └── adr/                — 29 ADRs (next: 030)
```

Package manager: `pnpm@10.28.1`. Workspace defined in `pnpm-workspace.yaml`.

---

## Architecture: Clean Architecture / DDD

**Layer rules — do not cross these:**

| Layer | Package | Rule |
|-------|---------|------|
| Domain | `@wishin/domain` | Zero deps on Appwrite SDK or UI frameworks. Pure logic only. |
| Application | `@wishin/domain/use-cases` | Coordinates domain objects. No SDK calls. |
| Infrastructure | `@wishin/infrastructure` | Implements domain repository interfaces using `react-native-appwrite`. |
| UI | `@wishin/expo-client` | Calls use cases via React contexts. No direct domain entity mutation. |

**Entity pattern** — every Domain Entity and Value Object must:
- Private constructor + public static `create()` factory method
- State in `private readonly props: XxxProps`
- Public getters reading from `this.props`
- `toProps()` returning `{ ...this.props }` (shallow copy)
- Modified instances use `...this.toProps()` as base

**Repository pattern:** Domain defines interfaces; Infrastructure implements them with Appwrite.

---

## Key Domain Concepts

- **WishlistItem states:** `Available → Reserved (temporary) → Purchased (final)`
- **Hybrid access:** both anonymous guests (capability-based security) and registered members
- **Atomic inventory:** reserve/purchase operations must guard against concurrent updates
- **Transactions:** denormalized (ADR 021); orphan lifecycle managed (ADR 017)
- **DB prefixing:** `EXPO_PUBLIC_DB_PREFIX` (e.g. `dev`, `test`) namespaces all collection names — both in provisioning and at runtime

---

## expo-client Source Layout

```text
src/
├── features/         — Feature slices: auth, wishlist, profile, landing, common, core, layout
├── components/       — Shared UI components
├── contexts/         — React contexts (UserContext, WishlistRepositoryContext, ToastContext)
├── providers/        — CoreProvider.tsx (infrastructure init, OAuth callback, session restore)
├── hooks/            — useWishlist, useGoogleSignIn, useImagePickerAndUpload, useAsyncAction
├── constants/        — Config.ts (reads EXPO_PUBLIC_* env vars)
├── theme/            — MD3 theme tokens
├── utils/            — Alert, etc.
└── types/
```

**`CoreProvider.tsx`** is the infrastructure entry point: creates all Appwrite repositories, restores session on startup (with `Config.SESSION_TIMEOUT_MS` timeout), and handles the web OAuth callback flow (reads `?userId=&secret=` from URL, strips params, calls `completeGoogleOAuth`, runs `EnsureProfileUseCase`).

---

## Monorepo + Metro Gotchas

**`metro.config.js`** (critical for pnpm hoisting):
```js
config.watchFolders = [workspaceRoot];           // watch entire monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true; // required for pnpm symlinks
```

**`babel.config.js`** aliases packages to their `src/` directories directly — Metro reads source, not compiled `dist/`:
```js
"@wishin/domain": "../../packages/domain/src"
// same for infrastructure, shared, expo-client
```

This means changes to packages are picked up immediately in dev without a build step, but `dist/` is stale during development (only matters for Node/test tooling).

**`tsconfig.base.json`** mirrors these paths for the TypeScript compiler.

---

## Appwrite & Environment Variables

```bash
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=<id>
EXPO_PUBLIC_APPWRITE_DATABASE_ID=wishin
EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=<id>
EXPO_PUBLIC_DB_PREFIX=dev           # 'test' for integration tests
EXPO_PUBLIC_BASE_URL=https://wishin.appwrite.network/
APPWRITE_API_SECRET=<secret>        # server-side only, never EXPO_PUBLIC_
DEV_ALLOW_OPEN_PERMISSIONS=false
```

`app.config.ts` reads `EXPO_PUBLIC_APPWRITE_PROJECT_ID` to generate the URL scheme `appwrite-callback-<PROJECT_ID>` needed for OAuth deep links. Missing in non-dev environments throws at startup.

**DB provisioning commands:**
```bash
pnpm db:provision          # create/update Appwrite collections
pnpm db:provision:test     # test environment (prefix=test, cleanup first)
pnpm db:reset              # cleanup + reprovision
pnpm db:seed               # seed dev data
```

---

## Testing

- **Framework:** Vitest everywhere
- **Discipline:** Strict TDD — failing test before production code, Red-Green-Refactor
- **Unit tests:** `pnpm test` — in-memory mocks, no network
- **Integration tests:** `pnpm test:integration` — hits real Appwrite (provisions fresh test DB first)

Domain tests live alongside source: `*.spec.ts` next to `*.ts`. Infrastructure has both unit (`mocks/`) and integration tests.

---

## UI Standards

- **Material Design 3** via `react-native-paper@5.15.0`
- Always use `react-native-paper` components when an equivalent exists — no raw RN primitives for UI
- All colors via `useTheme()` and MD3 tokens (`theme.colors.surface`, etc.) — no hardcoded hex values
- **`moti`** for animations

**Active patch:** `patches/react-native-paper@5.15.0.patch` — fixes `FABGroup` crashing on web by setting `accessibilityRole="none"` on web (upstream bug). Applied automatically by pnpm.

---

## Code Standards

- **TypeScript strict** — `no-explicit-any` enforced by ESLint
- **JSDoc** on every public method, class, and interface: describe purpose, `@param`, `@returns`, `@throws`, and business invariants for domain entities
- **No hardcoded colors, no raw `any`**
- **Observability:** wrap significant state changes in `OBSERVABILITY.addBreadcrumb()` / `trackEvent()` (Sentry + PostHog wired in production, console in dev)

---

## Git & CI

- **Conventional commits** enforced by `commitlint`
- **Husky hooks:**
  - `pre-commit`: lint-staged → eslint + prettier on TS/TSX, `pnpm install --lockfile-only` + stage `pnpm-lock.yaml` on package.json changes
- Run `pnpm lint` and `pnpm test` before pushing

### Branching Strategy

`main` is production/release; `develop` is the integration branch. **Nothing reaches `main` except through `develop`.**

- **Feature/fix branches always branch from `develop`**, and their PRs always target `develop` — never `main`.
- **`main` only receives merges from `develop`** (releases via `develop → main` PR).
- **Hotfix exception:** if production is broken and can't wait for the normal cycle, branch from `main` (`hotfix/x`), PR into `main` — but **immediately** merge/cherry-pick that same fix back into `develop` before doing anything else. Don't defer the back-merge.
- Never branch a fix off `main` for something that isn't a production emergency — it silently diverges `main` ahead of `develop` and causes "Can't automatically merge" on the next `develop → main` PR.
- `main` has branch protection requiring PRs; direct pushes are possible only via bypass (admin) and should be avoided except to land an already-reviewed merge commit resolving a `develop`/`main` divergence.

**Incident (2026-07-08):** `fix/reanimated-worklets-conflict` (PR #94) was branched from `main` and merged straight into `main`, skipping `develop`. This diverged the two branches (both later touched `package.json`/`pnpm-lock.yaml` independently), which blocked the next `develop → main` PR with a merge conflict. Fixed by merging `main` back into `develop` (commit `453fb52`) and regenerating `pnpm-lock.yaml` via `pnpm install`.

---

## ADR Process

ADRs live in `docs/adr/` — 29 exist (last: `029-automated-lockfile-synchronization.md`). Next number: **030**.

Rules:
1. Check last ADR number in `docs/adr/` before assigning a new one
2. Link new ADR in `README.md` under "Architectural Decision Records"
3. If superseding an existing ADR: update its Status to "Superseded by ADR NNN"; new ADR says "Supersedes ADR NNN"
4. If amending: update old Status to "Amended by ADR NNN"; new ADR says "Amends ADR NNN"

---

## Known Issues / Active Fixes

- **`react-native-reanimated`** was upgraded to `4.3.1` to fix a `libworklets.so` conflict on Android (PR on `fix/reanimated-worklets-conflict` branch merged into main recently). The `package.json` in expo-client shows `~4.1.1` — verify actual installed version if Android build issues appear.
