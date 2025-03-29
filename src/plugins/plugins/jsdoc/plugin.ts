import type { ESLintConfig, ESLintLegacyConfig } from "../..";

export const name = "eslint-plugin-jsdoc";
export const description = "JSDoc linting rules for ESLint.";
export const repo = "https://github.com/gajus/eslint-plugin-jsdoc";
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:jsdoc/recommended"],
};
export const eslintConfig: ESLintConfig<"jsdoc"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(`import jsdoc from 'eslint-plugin-jsdoc'`);
    } else {
      yield helper.require({
        local: "jsdoc",
        source: "eslint-plugin-jsdoc",
      });
    }
  },
  *expression(names, helper) {
    yield helper.x(`${names.jsdoc}.configs['flat/recommended']`);
  },
};
