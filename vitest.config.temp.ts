import { mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config.base";

export default mergeConfig(baseConfig, {
  test: {
    exclude: ["**/node_modules/**", "**/.git/**"],
    include: ["packages/infrastructure/test/integration/**/*.test.ts"],
    environment: "node",
  },
});
