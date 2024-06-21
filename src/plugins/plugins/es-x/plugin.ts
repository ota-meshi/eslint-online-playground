import type { ESLintConfig, ESLintLegacyConfig } from "../..";

export const name = "eslint-plugin-es-x";
export const description = "ESLint plugin about ECMAScript syntactic features.";
export const repo = "https://github.com/eslint-community/eslint-plugin-es-x";
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:es-x/restrict-to-es2019"],
};
export const eslintConfig: ESLintConfig<"es"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(`import es from 'eslint-plugin-es-x'`);
    } else {
      yield helper.require({
        local: "es",
        source: "eslint-plugin-es-x",
      });
    }
  },
  *expression(names, helper) {
    yield helper.x(`${names.es}.configs['flat/restrict-to-es2019']`);
  },
};
