import { defineConfig, defaultExclude } from "vitest/config";
import baseConfig from "./vitest.config.base";

// Manually override test configuration to avoid array concatenation from mergeConfig
export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ["packages/infrastructure/test/integration/**/*.test.ts"],
    exclude: [...defaultExclude],
  },
});
