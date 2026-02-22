/** @type {import("@babel/core").ConfigFunction} */
module.exports = function (api) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  api?.cache(true);
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
            "@wishin/app": "./src",
          },
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      ],
    ],
  };
};
