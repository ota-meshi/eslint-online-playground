export default {
  extends: ["eslint:recommended", "plugin:vue/vue3-recommended"],
  parserOptions: {
    parser: {
      ts: "@typescript-eslint/parser",
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
};
