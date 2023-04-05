export default {
  extends: ["plugin:eslint-plugin/recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: { node: true },
};
