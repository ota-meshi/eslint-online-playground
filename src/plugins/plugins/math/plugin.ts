import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-math";
export const meta: PluginMeta = {
  description: "ESLint plugin related to Math object and Number.",
  repo: "https://github.com/ota-meshi/eslint-plugin-math",
};
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:math/recommended-legacy"],
};
export const eslintConfig: ESLintConfig<"eslintPluginMath"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import eslintPluginMath from 'eslint-plugin-math'");
    } else {
      yield helper.require({
        local: "eslintPluginMath",
        source: "eslint-plugin-math",
      });
    }
  },
  *expression(names, helper) {
    yield helper.x(`${names.eslintPluginMath}.configs.recommended`);
  },
};
