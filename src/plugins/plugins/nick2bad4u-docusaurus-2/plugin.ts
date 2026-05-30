import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-docusaurus-2";
export const meta: PluginMeta = {
  description: "ESLint plugin for Docusaurus sites, docs repositories, and TypeDoc-integrated documentation workflows.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-docusaurus-2",
  lang: ["javascript", "typescript", "markdown"],
  package: "eslint-plugin-docusaurus-2",
};
export const devDependencies = { "eslint-plugin-docusaurus-2": "latest" };
const importName = "docusaurus2";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import docusaurus2 from 'eslint-plugin-docusaurus-2'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-docusaurus-2" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};