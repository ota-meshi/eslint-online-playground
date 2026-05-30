import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-remark";
export const meta: PluginMeta = {
  description: "ESLint plugin that runs Remark through ESLint and adds Remark-specific authoring rules.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-remark",
  lang: ["markdown"],
  package: "eslint-plugin-remark",
};
export const devDependencies = { "eslint-plugin-remark": "latest" };
const importName = "remark";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import remark from 'eslint-plugin-remark'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-remark" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.spread(await helper.x(recommended));
  },
};