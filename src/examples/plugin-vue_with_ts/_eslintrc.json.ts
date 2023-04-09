export default {
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    extraFileExtensions: [".vue"],
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx", "*.cts", "*.mts"],
      parser: "@typescript-eslint/parser",
    },
    {
      files: ["*.vue"],
      parser: "vue-eslint-parser",
      parserOptions: {
        parser: {
          ts: "@typescript-eslint/parser",
        },
      },
    },
  ],
};
