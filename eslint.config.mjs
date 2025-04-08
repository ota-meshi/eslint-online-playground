import globals from "globals";
import myPlugin from "@ota-meshi/eslint-plugin";
import js from "@eslint/js";

export default [
  {
    ignores: ["node_modules/", "dist/", "coverage/"],
  },
  js.configs.recommended,
  ...myPlugin.config({
    vue3: true,
    packageJson: true,
    json: true,
    yaml: true,
    toml: true,
    md: true,
    prettier: true,
    ts: true,
  }),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "jsdoc/require-jsdoc": "off",
      "no-shadow": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-shadow": "off",
      quotes: [
        "error",
        "double",
        {
          avoidEscape: true,
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,vue}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "monaco-editor",
              message: "Please use loaded monaco-editor instead.",
              allowTypeImports: true,
            },
          ],
          patterns: [
            {
              regex: "^@shikijs/",
              message: "Please use CDN instead.",
              allowTypeImports: true,
            },
            {
              regex: "^shiki/",
              message: "Please use CDN instead.",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/no-shadow": "off",
    },
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      "spaced-comment": "off",
    },
  },
  {
    files: ["**/*.toml"],
    rules: {
      "prettier/prettier": "off",
    },
  },
];
