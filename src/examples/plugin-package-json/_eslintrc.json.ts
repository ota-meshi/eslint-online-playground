export default {
  overrides: [
    {
      extends: ["plugin:package-json/recommended"],
      files: ["**/package.json"],
      parser: "jsonc-eslint-parser",
      plugins: ["package-json"],
    },
  ],
};
