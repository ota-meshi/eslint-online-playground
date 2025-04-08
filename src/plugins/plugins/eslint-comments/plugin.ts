import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "@eslint-community/eslint-plugin-eslint-comments";
export const meta: PluginMeta = {
  description: "Additional ESLint rules for directive comments of ESLint.",
  repo: "https://github.com/eslint-community/eslint-plugin-eslint-comments",
};
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:@eslint-community/eslint-comments/recommended"],
};
export const eslintConfig: ESLintConfig<"comments"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(
        'import comments from "@eslint-community/eslint-plugin-eslint-comments/configs"',
      );
    } else {
      yield helper.require({
        local: "comments",
        source: "@eslint-community/eslint-plugin-eslint-comments/configs",
      });
    }
  },
  *expression(names, helper) {
    yield helper.x(`${names.comments}.recommended`);
  },
};
