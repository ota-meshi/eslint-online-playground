import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-test-signal";
export const meta: PluginMeta = {
  description: "ESLint rules that flag weak tests before they become false confidence.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-test-signal",
  lang: ["javascript", "typescript"],
  package: "eslint-plugin-test-signal",
};
export const devDependencies = { "eslint-plugin-test-signal": "latest" };
const importName = "testSignal";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import testSignal from 'eslint-plugin-test-signal'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-test-signal" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};