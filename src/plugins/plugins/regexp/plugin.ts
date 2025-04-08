import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-regexp";
export const meta: PluginMeta = {
  description:
    "ESLint plugin for finding RegExp mistakes and RegExp style guide violations.",
  repo: "https://github.com/ota-meshi/eslint-plugin-regexp",
};
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:regexp/recommended"],
};
export const eslintConfig: ESLintConfig<"regexp"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import regexp from 'eslint-plugin-regexp'");
    } else {
      yield helper.require({
        local: "regexp",
        source: "eslint-plugin-regexp",
      });
    }
  },
  *expression(names, helper) {
    yield helper.x(`${names.regexp}.configs['flat/recommended']`);
  },
};
