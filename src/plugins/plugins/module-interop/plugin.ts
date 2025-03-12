import type { ESLintConfig } from "../..";

export const name = "eslint-plugin-module-interop";
export const description =
  "ESLint plugin with rules for module interoperability";
export const repo = "https://github.com/ota-meshi/eslint-plugin-module-interop";
export const devDependencies = { [name]: "latest" };
export const eslintConfig: ESLintConfig<"moduleInteropPlugin"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(
        `import moduleInteropPlugin from "eslint-plugin-module-interop"`,
      );
    } else {
      yield helper.require({
        local: "moduleInteropPlugin",
        source: "eslint-plugin-module-interop",
      });
    }
  },
  *expression(names, helper) {
    yield helper.x(`${names.moduleInteropPlugin}.configs.recommended`);
    yield helper.x(
      `{
        rules: { 'module-interop/no-import-cjs': 'error', 'module-interop/no-require-esm': 'error' },
        languageOptions: {
          globals: {
            require: 'readonly'
          }
        }
       }`,
    );
  },
};
