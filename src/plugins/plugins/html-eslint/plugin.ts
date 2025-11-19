import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "@html-eslint/eslint-plugin";
export const meta: PluginMeta = {
  description: "An ESLint plugin for formatting and linting HTML.",
  repo: "https://github.com/yeonjuan/html-eslint",
  lang: ["html"],
};
export const devDependencies = {
  [name]: "latest",
  "@html-eslint/parser": "latest",
};
export const eslintLegacyConfig: ESLintLegacyConfig = {
  plugins: ["@html-eslint"],
  overrides: [
    {
      files: ["*.html"],
      parser: "@html-eslint/parser",
      extends: ["plugin:@html-eslint/recommended-legacy"],
    },
  ],
};
export const eslintConfig: ESLintConfig<"html"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(`import html from '${name}'`);
    } else {
      yield helper.require({
        local: "html",
        source: name,
      });
    }
  },
  async *expression(names, helper) {
    yield helper.x(`{
        files: ["**/*.html"],
        plugins: {
            html: ${names.html},
        },
        // When using the recommended rules
        extends: ["html/recommended"],
        language: "html/html",
        rules: {
            "html/no-duplicate-class": "error",
        }
    }`);
  },
};
