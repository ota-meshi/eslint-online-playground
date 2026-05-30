import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-tsconfig";
export const meta: PluginMeta = {
  description: "ESLint plugin to catch bad tsconfig compiler-option combos, project reference misconfiguration, and policy drift before tsc.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-tsconfig",
  lang: ["json"],
  package: "eslint-plugin-tsconfig",
};
export const devDependencies = { "eslint-plugin-tsconfig": "latest" };
const importName = "tsconfig";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import tsconfig from 'eslint-plugin-tsconfig'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-tsconfig" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};