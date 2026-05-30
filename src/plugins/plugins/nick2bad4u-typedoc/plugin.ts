import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-typedoc";
export const meta: PluginMeta = {
  description: "ESLint rules for TypeDoc documentation quality, validation, and autofix workflows.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-typedoc",
  lang: ["typescript", "markdown"],
  package: "eslint-plugin-typedoc",
};
export const devDependencies = { "eslint-plugin-typedoc": "latest" };
const importName = "typedoc";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import typedoc from 'eslint-plugin-typedoc'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-typedoc" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};