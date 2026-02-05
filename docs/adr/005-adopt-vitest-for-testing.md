# ADR 005: Adopt Vitest for Testing

## Status

Accepted

## Context

In a 2026 monorepo environment, ensuring seamless interoperability between ESM (ECMAScript Modules) and CommonJS is critical. Our current setup using Jest has encountered significant friction regarding module resolution, specifically requiring intricate configuration (e.g., intermediate `.cts` files) to handle TypeScript projects correctly. Additionally, as the codebase grows, test execution speed becomes a more pressing concern. We need a testing solution that offers native ESM support and faster performance to maintain a high-velocity local development workflow.

## Decision

We will adopt **Vitest** as the primary testing framework for the `domain`, `infrastructure`, and `shared` packages. (Amends ADR 002)

We will strictly use Vitest for these backend/logic-heavy packages. However, we will maintain the flexibility to use Jest for `apps/app` (the mobile application) if the integration with Expo/React Native tooling makes it strictly necessary or significantly more convenient.

## Consequences

- **Simplified Configuration**: We can retire the complex `jest.config.ts`/`.cts` chains and use clean, TypeScript-based `vitest.config.ts` files that work out-of-the-box with our build toolchain.
- **Improved DX**: Native ESM support means fewer "gymnastics" to get tests running. Watch mode and general execution should be noticeably faster.
- **Cleanup**: We will remove the recently introduced `.cts` intermediate configuration files.
- **Tooling Consistency**: Vitest shares a lot of commonality with Vite (if used elsewhere), unifying the toolchain.
