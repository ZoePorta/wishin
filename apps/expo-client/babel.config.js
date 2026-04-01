const path = require("path");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@wishin/domain": path.resolve(
              __dirname,
              "../../packages/domain/src",
            ),
            "@wishin/infrastructure": path.resolve(
              __dirname,
              "../../packages/infrastructure/src",
            ),
            "@wishin/shared": path.resolve(
              __dirname,
              "../../packages/shared/src",
            ),
            "@wishin/expo-client": path.resolve(__dirname, "./src"),
          },
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      ],
    ],
  };
};
