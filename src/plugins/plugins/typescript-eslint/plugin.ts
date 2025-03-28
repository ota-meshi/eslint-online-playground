import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "typescript-eslint";
export const description =
  "The tooling that enables ESLint and Prettier to support TypeScript";
export const repo = "https://github.com/typescript-eslint/typescript-eslint";
export const devDependencies = {
  "@typescript-eslint/parser": "latest",
  "@typescript-eslint/eslint-plugin": "latest",
  typescript: "latest",
  "typescript-eslint": "latest",
};
export const eslintLegacyConfig: ESLintLegacyConfig = {
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended"],
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
      ],
      parser: "@typescript-eslint/parser",
    },
  ],
};
export const eslintConfig: ESLintConfig<"tseslint"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(`import tseslint from 'typescript-eslint'`);
    } else {
      yield helper.require({
        local: "tseslint",
        source: "typescript-eslint",
      });
    }
  },
  async *expression(names, helper) {
    yield helper.spread(
      await helper.x(
        `${names.tseslint}.config(...${names.tseslint}.configs.recommended)`,
      ),
    );
  },
};
export function hasInstalled(packageJson: any): boolean {
  const pluginNames = ["@typescript-eslint/eslint-plugin", "typescript-eslint"];
  return pluginNames.some(
    (pluginName) =>
      packageJson.devDependencies?.[pluginName] != null ||
      packageJson.dependencies?.[pluginName] != null,
  );
}
export const meta: PluginMeta = { lang: "typescript" };
