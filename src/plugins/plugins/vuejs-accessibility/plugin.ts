import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-vuejs-accessibility";
export const meta: PluginMeta = {
  description: "An eslint plugin for checking Vue.js files for accessibility.",
  repo: "https://github.com/vue-a11y/eslint-plugin-vuejs-accessibility",
  lang: ["vue"],
};
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:vuejs-accessibility/recommended"],
};
const importName = "vueA11y";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(`import ${importName} from '${name}'`);
    } else {
      yield helper.require({
        local: importName,
        source: name,
      });
    }
  },
  async *expression(names, helper) {
    yield helper.spread(
      await helper.x(`${names[importName]}.configs["flat/recommended"]`),
    );
  },
};
