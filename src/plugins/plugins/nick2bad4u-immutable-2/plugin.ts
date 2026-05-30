import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-immutable-2";
export const meta: PluginMeta = {
  description: "ESLint rules for enforcing immutable and functional code patterns.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-immutable-2",
  lang: ["javascript", "typescript"],
  package: "eslint-plugin-immutable-2",
};
export const devDependencies = { "eslint-plugin-immutable-2": "latest" };
const importName = "immutable2";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import immutable2 from 'eslint-plugin-immutable-2'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-immutable-2" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};