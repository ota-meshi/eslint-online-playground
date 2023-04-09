export default {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:astro/recommended",
    "plugin:astro/jsx-a11y-strict",
  ],
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "astro/no-unused-css-selector": "error",
    "astro/prefer-class-list-directive": "error",
    "astro/prefer-object-class-list": "error",
    "astro/prefer-split-class-list": "error",
  },
};
