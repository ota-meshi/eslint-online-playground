export default {
  extends: ["eslint:recommended", "plugin:markdown/recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "no-console": "error",
  },
};
