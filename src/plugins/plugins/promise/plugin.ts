import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-promise";
export const meta: PluginMeta = {
  description: "Enforce best practices for JavaScript promises.",
  repo: "https://github.com/eslint-community/eslint-plugin-promise",
};
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:promise/recommended"],
};
export const eslintConfig: ESLintConfig<"pluginPromise"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(`import pluginPromise from '${name}'`);
    } else {
      yield helper.require({
        local: "pluginPromise",
        source: name,
      });
    }
  },
  *expression(names, helper) {
    yield helper.x(`${names.pluginPromise}.configs['flat/recommended']`);
  },
};
