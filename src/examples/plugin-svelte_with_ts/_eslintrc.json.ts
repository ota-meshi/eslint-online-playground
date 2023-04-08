export default {
  extends: ["eslint:recommended", "plugin:svelte/recommended"],
  parserOptions: {
    parser: {
      ts: "@typescript-eslint/parser",
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
};
