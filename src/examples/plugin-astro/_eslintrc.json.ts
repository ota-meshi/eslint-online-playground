export default {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:astro/recommended",
    "plugin:astro/jsx-a11y-strict",
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    extraFileExtensions: [".astro"],
  },
  rules: {
    "astro/no-unused-css-selector": "error",
    "astro/prefer-class-list-directive": "error",
    "astro/prefer-object-class-list": "error",
    "astro/prefer-split-class-list": "error",
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx", "*.cts", "*.mts"],
      parser: "@typescript-eslint/parser",
    },
    {
      files: ["*.astro"],
      parser: "astro-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },
  ],
};
