export const name = "typescript-eslint";
export const description =
  "The tooling that enables ESLint and Prettier to support TypeScript";
export const repo = "https://github.com/typescript-eslint/typescript-eslint";
export const devDependencies = {
  "@typescript-eslint/parser": "latest",
  "@typescript-eslint/eslint-plugin": "latest",
  typescript: "latest",
};
export const eslintLegacyConfig = {
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
export function hasInstalled(packageJson: any): boolean {
  const pluginName = "@typescript-eslint/eslint-plugin";
  return (
    packageJson.devDependencies?.[pluginName] != null ||
    packageJson.dependencies?.[pluginName] != null
  );
}
