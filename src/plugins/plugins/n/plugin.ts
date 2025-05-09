import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-n";
export const meta: PluginMeta = {
  description: "Additional ESLint's rules for Node.js.",
  repo: "https://github.com/eslint-community/eslint-plugin-n",
};
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:n/recommended"],
};
export const eslintConfig: ESLintConfig<"nodePlugin"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i('import nodePlugin from "eslint-plugin-n"');
    } else {
      yield helper.require({
        local: "nodePlugin",
        source: "eslint-plugin-n",
      });
    }
  },
  *expression(names, helper) {
    yield helper.x(`${names.nodePlugin}.configs['flat/recommended']`);
  },
};
