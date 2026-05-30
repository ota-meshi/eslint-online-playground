import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-vite";
export const meta: PluginMeta = {
  description: "ESLint rules for Vite, Vitest, and Vitest bench configuration and runtime patterns.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-vite",
  lang: ["javascript", "typescript"],
  package: "@typpi/eslint-plugin-vite",
};
export const devDependencies = { "@typpi/eslint-plugin-vite": "latest" };
const importName = "vite";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import vite from '@typpi/eslint-plugin-vite'");
    } else {
      yield helper.require({ local: importName, source: "@typpi/eslint-plugin-vite" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};