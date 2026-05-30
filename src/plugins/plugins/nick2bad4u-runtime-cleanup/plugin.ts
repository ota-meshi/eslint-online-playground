import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-runtime-cleanup";
export const meta: PluginMeta = {
  description: "ESLint rules for requiring cleanup of runtime resources.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-runtime-cleanup",
  lang: ["javascript", "typescript"],
  package: "eslint-plugin-runtime-cleanup",
};
export const devDependencies = { "eslint-plugin-runtime-cleanup": "latest" };
const importName = "runtimeCleanup";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import runtimeCleanup from 'eslint-plugin-runtime-cleanup'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-runtime-cleanup" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};