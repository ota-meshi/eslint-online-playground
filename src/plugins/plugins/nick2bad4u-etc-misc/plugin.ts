import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-etc-misc";
export const meta: PluginMeta = {
  description: "ESLint Plugin combining eslint-plugin-etc and eslint-plugin-misc.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-etc-misc",
  lang: ["javascript", "typescript"],
  package: "eslint-plugin-etc-misc",
};
export const devDependencies = { "eslint-plugin-etc-misc": "latest" };
const importName = "etcMisc";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import etcMisc from 'eslint-plugin-etc-misc'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-etc-misc" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};