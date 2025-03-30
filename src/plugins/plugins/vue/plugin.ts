import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-vue";
export const meta: PluginMeta = {
  description: "Official ESLint plugin for Vue.js.",
  repo: "https://github.com/vuejs/eslint-plugin-vue",
  lang: ["vue"],
};
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:vue/vue3-recommended"],
};
export const eslintConfig: ESLintConfig<"vue"> = {
  *imports({ type, i, require }) {
    yield type === "module"
      ? i(`import vue from "${name}"`)
      : require({
          local: "vue",
          source: name,
        });
  },
  async *expression(names, helper) {
    yield helper.spread(
      await helper.x(`${names.vue}.configs['flat/recommended']`),
    );
  },
};
