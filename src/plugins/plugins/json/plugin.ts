import type { ESLintConfig, PluginMeta } from "../..";

export const name = "@eslint/json";
export const description = "JSON language plugin for ESLint.";
export const repo = "https://github.com/eslint/json";
export const devDependencies = { [name]: "latest" };
export const eslintConfig: ESLintConfig<"json"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(`import json from '${name}'`);
    } else {
      yield helper.require({
        local: "json",
        source: name,
      });
    }
  },
  *expression(names, helper) {
    yield helper.x(
      `{ files: ["**/*.json"], ignores: ["package-lock.json"], language: "json/json", ...${names.json}.configs.recommended}`,
    );
    yield helper.x(
      `{ files: ["**/*.jsonc"], language: "json/jsonc", ...${names.json}.configs.recommended }`,
    );
    yield helper.x(
      `{ files: ["**/*.json5"], language: "json/json5", ...${names.json}.configs.recommended }`,
    );
  },
};
export const meta: PluginMeta = { lang: ["json"] };
