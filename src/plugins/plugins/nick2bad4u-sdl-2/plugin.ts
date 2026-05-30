import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-sdl-2";
export const meta: PluginMeta = {
  description: "ESLint plugin providing SDL-focused security and platform hardening rules.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-SDL-2",
  lang: ["javascript", "typescript"],
  package: "eslint-plugin-sdl-2",
};
export const devDependencies = { "eslint-plugin-sdl-2": "latest" };
const importName = "sdl2";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import sdl2 from 'eslint-plugin-sdl-2'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-sdl-2" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.spread(await helper.x(recommended));
  },
};