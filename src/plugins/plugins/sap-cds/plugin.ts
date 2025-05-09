import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "@sap/eslint-plugin-cds";
export const meta: PluginMeta = {
  description:
    "SAP Cloud Application Programming Model (CAP) model and environment linting rules.",
  lang: ["cds"],
};
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:@sap/cds/recommended-legacy"],
};
export const eslintConfig: ESLintConfig<"cds"> = {
  *imports({ type, i, require }) {
    yield type === "module"
      ? i(`import cds from "${name}"`)
      : require({
          local: "cds",
          source: name,
        });
  },
  *expression(names, helper) {
    yield helper.x(`${names.cds}.configs.recommended`);
  },
};
