import baseConfig from "../../jest.config.base";

export default {
  ...baseConfig,
  displayName: "infrastructure",
  rootDir: "../..",
  roots: ["<rootDir>/packages/infrastructure"],
};
