// @ts-expect-error ignore
import { rules } from "eslint-plugin-security";
export default {
  plugins: ["security"],
  extends: ["plugin:security/recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: { node: true },
  rules: Object.fromEntries(
    Object.keys(rules).map((rule) => [`security/${rule}`, "error"])
  ),
};
