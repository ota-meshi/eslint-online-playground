import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-write-good-comments-2";
export const meta: PluginMeta = {
  description: "ESLint plugin that lints source comments for prose quality, inclusive language, profanity, spelling, readability, and task hygiene.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-write-good-comments-2",
  lang: ["javascript", "typescript", "markdown"],
  package: "eslint-plugin-write-good-comments-2",
};
export const devDependencies = { "eslint-plugin-write-good-comments-2": "latest" };
const importName = "writeGoodComments2";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import writeGoodComments2 from 'eslint-plugin-write-good-comments-2'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-write-good-comments-2" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.x(recommended);
  },
};