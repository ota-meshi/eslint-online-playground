import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-typefest";
export const meta: PluginMeta = {
  description: "ESLint rules for adopting type-fest and ts-extras conventions.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-typefest",
  lang: ["typescript"],
  package: "eslint-plugin-typefest",
};
export const devDependencies = { "eslint-plugin-typefest": "latest" };
const importName = "typefest";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import typefest from 'eslint-plugin-typefest'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-typefest" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};