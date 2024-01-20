export default {
  overrides: [
    {
      // There is a problem with presets.
      // extends: ["plugin:package-json/recommended"],
      files: ["**/package.json"],
      parser: "jsonc-eslint-parser",
      plugins: ["package-json"],
      rules: {
        // Maybe bug?
        // "package-json/order-properties": "error",
        "package-json/sort-collections": "error",
      },
    },
  ],
};
