import type { ESLintConfig } from "../..";

export const name = "eslint-plugin-eslint-plugin";
export const description = "An ESLint plugin for linting ESLint plugins.";
export const repo =
  "https://github.com/eslint-community/eslint-plugin-eslint-plugin";
export const devDependencies = { [name]: "latest" };
export const eslintConfig: ESLintConfig<"eslintPlugin"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(`import eslintPlugin from '${name}'`);
    } else {
      yield helper.require({
        local: "eslintPlugin",
        source: name,
      });
    }
  },
  *expression(names, helper) {
    yield helper.x(`${names.eslintPlugin}.configs['flat/recommended']`);
  },
};
