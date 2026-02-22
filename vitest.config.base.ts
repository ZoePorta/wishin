import { defineConfig, defaultExclude } from "vitest/config";
import _tsconfigPaths from "vite-tsconfig-paths";

// Handle CJS/ESM interop for vite-tsconfig-paths
const tsconfigPaths =
  (_tsconfigPaths as unknown as { default?: typeof _tsconfigPaths }).default ??
  _tsconfigPaths;

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    exclude: [...defaultExclude, "**/integration/**", "**/*.int.test.ts"],
  },
});
