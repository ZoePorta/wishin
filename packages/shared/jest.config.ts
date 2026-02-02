import baseConfig from "../../jest.config.base";

export default {
  ...baseConfig,
  displayName: "shared",
  rootDir: "../..",
  roots: ["<rootDir>/packages/shared"],
};
