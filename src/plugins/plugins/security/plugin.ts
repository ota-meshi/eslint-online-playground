export const name = "eslint-plugin-security";
export const description = "Security rules for eslint";
export const repo =
  "https://github.com/eslint-community/eslint-plugin-security";
export const devDependencies = { [name]: "latest" };
export const eslintConfig = {
  plugins: ["security"],
  extends: ["plugin:security/recommended"],
};
