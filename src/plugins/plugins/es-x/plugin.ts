export const name = "eslint-plugin-es-x";
export const description = "ESLint plugin about ECMAScript syntactic features.";
export const repo = "https://github.com/eslint-community/eslint-plugin-es-x";
export const devDependencies = { [name]: "latest" };
export const eslintConfig = {
  extends: ["plugin:es-x/restrict-to-es2019"],
};
