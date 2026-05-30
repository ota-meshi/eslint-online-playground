import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-stylelint-2";
export const meta: PluginMeta = {
  description: "ESLint plugin that runs Stylelint through ESLint and adds Stylelint-specific authoring rules.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-stylelint-2",
  lang: ["css", "vue"],
  package: "eslint-plugin-stylelint-2",
};
export const devDependencies = { "eslint-plugin-stylelint-2": "latest" };
const importName = "stylelint2";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import stylelint2 from 'eslint-plugin-stylelint-2'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-stylelint-2" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.spread(await helper.x(recommended));
  },
};