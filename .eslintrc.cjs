module.exports = {
  root: true,
  env: {
    browser: true,
    es2017: true,
    node: true,
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: "latest",
  },
  extends: [
    "eslint:recommended",
    "plugin:@ota-meshi/recommended",
    "plugin:@ota-meshi/+vue3",
    "plugin:@ota-meshi/+package-json",
    "plugin:@ota-meshi/+json",
    "plugin:@ota-meshi/+yaml",
    "plugin:@ota-meshi/+toml",
    "plugin:@ota-meshi/+md",
    "plugin:@ota-meshi/+prettier",
  ],
  rules: {
    "require-jsdoc": "off",
    "no-shadow": "off",
    "no-unused-vars": "off",
  },
  overrides: [
    {
      files: ["*.ts"],
      plugins: ["@typescript-eslint"],
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@ota-meshi/+typescript",
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
      rules: {
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-use-before-define": "off",
      },
    },
    { files: ["*.d.ts"], rules: { "spaced-comment": "off" } },
  ],
};
