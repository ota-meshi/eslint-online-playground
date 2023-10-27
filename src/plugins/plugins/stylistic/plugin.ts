export const name = "ESLint Stylistic";
export const description = "Stylistic Formatting for ESLint";
export const repo = "https://eslint.style/";
export const devDependencies = {
  "@stylistic/eslint-plugin": "latest",
  "@stylistic/eslint-plugin-js": "latest",
  "@stylistic/eslint-plugin-ts": "latest",
  "@stylistic/eslint-plugin-jsx": "latest",
};
export const eslintConfig = {
  plugins: ["@stylistic", "@stylistic/js", "@stylistic/ts", "@stylistic/jsx"],
};
