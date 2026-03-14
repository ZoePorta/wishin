import { mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.config.base";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(baseConfig, {
  test: {
    name: "@wishin/infrastructure",
    environment: "node",
    setupFiles: [path.resolve(__dirname, "test/integration/setup.ts")],
  },
});
