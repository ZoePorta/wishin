import { defineConfig, defaultExclude } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    exclude: [...defaultExclude, "**/integration/**", "**/*.int.test.ts"],
  },
});
