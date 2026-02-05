import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/.next/**",
    ],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        project: [
          "./tsconfig.json",
          "./tsconfig.eslint.json",
          "./packages/*/tsconfig.json",
          "./apps/*/tsconfig.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/require-await": "off", // Too noisy often, let's enable if needed, but strictly requested 'strict'. strictTypeChecked enables it. I'll leave it unless it errors too much.
      "@typescript-eslint/no-floating-promises": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-empty-function": "off",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts", "**/test/**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Tests often mock with any
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    files: ["eslint.config.js"],
    ...tseslint.configs.disableTypeChecked,
  },
);
