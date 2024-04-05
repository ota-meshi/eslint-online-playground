import type { ESLintLegacyConfig } from "../..";

export const name = "@sap/eslint-plugin-cds";
export const description =
  "SAP Cloud Application Programming Model (CAP) model and environment linting rules";
export const depencencies = { "@sap/cds": "^7.0.0" };
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:@sap/cds/recommended"],
};
