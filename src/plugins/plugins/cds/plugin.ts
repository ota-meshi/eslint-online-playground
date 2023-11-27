export const name = "@sap/eslint-plugin-cds";
export const description =
  "SAP Cloud Application Programming Model (CAP) model and environment linting rules";
export const devDependencies = { [name]: "latest", "@sap/cds-dk": "latest" };
export const eslintConfig = {
  extends: ["plugin:@sap/cds/recommended"],
};
