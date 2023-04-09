export default {
  extends: ["eslint:recommended", "plugin:jsdoc/recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: {
    es2022: true,
    browser: true,
  },
};
