import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-github-actions-2";
export const meta: PluginMeta = {
  description: "ESLint plugin for GitHub Actions workflow quality, reliability, and security rules.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-github-actions-2",
  lang: ["yaml"],
  package: "eslint-plugin-github-actions-2",
};
export const devDependencies = { "eslint-plugin-github-actions-2": "latest" };
const importName = "githubActions2";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import githubActions2 from 'eslint-plugin-github-actions-2'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-github-actions-2" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};