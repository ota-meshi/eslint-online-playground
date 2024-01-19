import type { ESLintLegacyConfig } from "../..";

export const name = "eslint-plugin-n";
export const description = "Additional ESLint's rules for Node.js";
export const repo = "https://github.com/eslint-community/eslint-plugin-n";
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:n/recommended"],
};
