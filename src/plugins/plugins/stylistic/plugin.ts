import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "ESLint Stylistic";
export const description = "Stylistic Formatting for ESLint.";
export const repo = "https://eslint.style/";
export const devDependencies = {
  "@stylistic/eslint-plugin": "latest",
  "@stylistic/eslint-plugin-js": "latest",
  "@stylistic/eslint-plugin-ts": "latest",
  "@stylistic/eslint-plugin-jsx": "latest",
  "@stylistic/eslint-plugin-plus": "latest",
};
export const eslintLegacyConfig: ESLintLegacyConfig = {
  plugins: [
    "@stylistic",
    "@stylistic/js",
    "@stylistic/ts",
    "@stylistic/jsx",
    "@stylistic/plus",
  ],
  extends: ["plugin:@stylistic/recommended-extends"],
};
export const eslintConfig: ESLintConfig<"stylistic"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import stylistic from '@stylistic/eslint-plugin'");
    } else {
      yield helper.require({
        local: "stylistic",
        source: "@stylistic/eslint-plugin",
      });
    }
  },
  *expression(names, helper) {
    yield helper.x(`${names.stylistic}.configs['recommended-flat']`);
  },
};
export function hasInstalled(packageJson: any): boolean {
  const pluginName = "@stylistic/eslint-plugin";
  return (
    packageJson.devDependencies?.[pluginName] != null ||
    packageJson.dependencies?.[pluginName] != null
  );
}
export const meta: PluginMeta = { lang: ["javascript", "typescript", "jsx"] };
