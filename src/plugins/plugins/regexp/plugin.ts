import type { ESLintConfig, ESLintLegacyConfig } from "../..";

export const name = "eslint-plugin-regexp";
export const description =
  "ESLint plugin for finding RegExp mistakes and RegExp style guide violations.";
export const repo = "https://github.com/ota-meshi/eslint-plugin-regexp";
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:regexp/recommended"],
};
export const eslintConfig: ESLintConfig<"regexp"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(`import regexp from 'eslint-plugin-regexp'`);
    } else {
      yield helper.require({
        local: "regexp",
        source: "eslint-plugin-regexp",
      });
    }
  },
  *expression(names, helper) {
    yield helper.x(`${names.regexp}.configs['flat/recommended']`);
  },
};
