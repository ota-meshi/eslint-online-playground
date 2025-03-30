import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-vue-scoped-css";
export const meta: PluginMeta = {
  description: "ESLint plugin for Scoped CSS in Vue.js.",
  repo: "https://github.com/future-architect/eslint-plugin-vue-scoped-css",
  lang: ["vue"],
};
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:vue-scoped-css/vue3-recommended"],
};
const importName = "vueScopedCSS";
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
      await helper.x(`${names[importName]}.configs['flat/recommended']`),
    );
  },
};
