import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-tsdoc-require-2";
export const meta: PluginMeta = {
  description: "Require TSDoc comments for exported TypeScript declarations.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-tsdoc-require-2",
  lang: ["typescript"],
  package: "eslint-plugin-tsdoc-require-2",
};
export const devDependencies = { "eslint-plugin-tsdoc-require-2": "latest" };
const importName = "tsdocRequire2";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import tsdocRequire2 from 'eslint-plugin-tsdoc-require-2'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-tsdoc-require-2" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};