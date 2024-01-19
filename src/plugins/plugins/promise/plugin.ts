import type { ESLintLegacyConfig } from "../..";

export const name = "eslint-plugin-promise";
export const description = "Enforce best practices for JavaScript promises";
export const repo = "https://github.com/eslint-community/eslint-plugin-promise";
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:promise/recommended"],
};
