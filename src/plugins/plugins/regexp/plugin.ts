export const name = "eslint-plugin-regexp";
export const description =
  "ESLint plugin for finding RegExp mistakes and RegExp style guide violations.";
export const repo = "https://github.com/ota-meshi/eslint-plugin-regexp";
export const devDependencies = { [name]: "latest" };
export const eslintConfig = {
  extends: ["plugin:regexp/recommended"],
};
