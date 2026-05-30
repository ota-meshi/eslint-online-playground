import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-copilot";
export const meta: PluginMeta = {
  description: "ESLint rules for GitHub Copilot repository customization files.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-copilot",
  lang: ["markdown"],
  package: "eslint-plugin-copilot",
};
export const devDependencies = { "eslint-plugin-copilot": "latest" };
const importName = "copilot";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import copilot from 'eslint-plugin-copilot'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-copilot" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.spread(await helper.x(recommended));
  },
};