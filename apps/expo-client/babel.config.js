/** @type {import("@babel/core").ConfigFunction} */
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
            "@wishin/domain": "../../packages/domain/src",
            "@wishin/infrastructure": "../../packages/infrastructure/src",
            "@wishin/shared": "../../packages/shared/src",
            "@wishin/expo-client": "./src",
          },
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      ],
    ],
  };
};
