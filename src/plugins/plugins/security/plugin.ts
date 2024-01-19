import type { ESLintConfig, ESLintLegacyConfig } from "../..";

export const name = "eslint-plugin-security";
export const description = "Security rules for eslint";
export const repo =
  "https://github.com/eslint-community/eslint-plugin-security";
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  plugins: ["security"],
  extends: ["plugin:security/recommended-legacy"],
};
export const eslintConfig: ESLintConfig<"pluginSecurity"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import pluginSecurity from 'eslint-plugin-security'");
    } else {
      yield helper.i(
        "import * as pluginSecurity from 'eslint-plugin-security'",
      );
    }
  },
  *expression(names, helper) {
    yield helper.x(`${names.pluginSecurity}.configs.recommended`);
  },
};
