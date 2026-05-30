import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-file-progress-2";
export const meta: PluginMeta = {
  description: "ESLint plugin to print file progress.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-file-progress-2",
  lang: ["javascript", "typescript"],
  package: "eslint-plugin-file-progress-2",
};
export const devDependencies = { "eslint-plugin-file-progress-2": "latest" };
const importName = "fileProgress2";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import fileProgress2 from 'eslint-plugin-file-progress-2'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-file-progress-2" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};