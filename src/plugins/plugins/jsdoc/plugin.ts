export const name = "eslint-plugin-jsdoc";
export const description = "JSDoc linting rules for ESLint";
export const repo = "https://github.com/gajus/eslint-plugin-jsdoc";
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig = {
  extends: ["plugin:jsdoc/recommended"],
};
