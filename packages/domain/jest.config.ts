import baseConfig from "../../jest.config.base";

export default {
  ...baseConfig,
  displayName: "domain",
  rootDir: "../..",
  roots: ["<rootDir>/packages/domain"],
};
