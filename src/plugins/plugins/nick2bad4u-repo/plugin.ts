import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-repo";
export const meta: PluginMeta = {
  description: "ESLint rules for repository compliance across common hosting and deployment services.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-repo",
  lang: ["javascript", "typescript", "json", "yaml"],
  package: "eslint-plugin-repo",
};
export const devDependencies = { "eslint-plugin-repo": "latest" };
const importName = "repo";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import repo from 'eslint-plugin-repo'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-repo" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};