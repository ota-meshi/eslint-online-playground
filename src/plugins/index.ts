import { customCompare } from "../utils/compare";
import type * as ESTree from "estree";

export type ESLintLegacyConfig = {
  plugins?: string[];
  extends?: string[];
  overrides?: {
    files: string[];
    extends?: string[];
    parser?: string;
  }[];
};
export type BuildESLintConfigHelper = {
  x(code: string): ESTree.Expression;
  spread(expression: ESTree.Expression): ESTree.SpreadElement;
  i(code: string): ESTree.ImportDeclaration;
  require(def: { local: string; source: string }): ESTree.ImportDeclaration;
  type: "module" | "script";
};
export type ESLintConfig<N extends string> = {
  /** Return an ImportDeclaration that imports the plugin. */
  imports: (
    helper: BuildESLintConfigHelper,
  ) => Iterable<ESTree.ImportDeclaration>;
  /** Return an Expression or SpreadElement that represents the element to configure. */
  expression: (
    names: Record<N, string>,
    helper: BuildESLintConfigHelper,
  ) => Iterable<ESTree.Expression | ESTree.SpreadElement>;
};

export type Plugin = {
  name: string;
  description?: string;
  repo?: string;
  devDependencies: Record<string, string>;
  eslintLegacyConfig?: ESLintLegacyConfig;
  eslintConfig?: ESLintConfig<string>;
  hasInstalled?: (packageJson: any) => boolean;
};

export * from "./installer";

let allPlugins: Record<string, Plugin> | null = null;

export async function loadPlugins(): Promise<Record<string, Plugin>> {
  if (allPlugins) {
    return allPlugins;
  }
  allPlugins = {};

  const list = (
    await Promise.all([
      ...Object.entries(import.meta.glob("./plugins/**/*.ts")).map(
        async ([fileName, content]) => {
          const plugin = { ...((await content()) as Plugin) };
          if (!plugin.name) {
            plugin.name = convertToName(fileName);
          }
          if (!plugin.hasInstalled) {
            plugin.hasInstalled = function hasInstalled(
              packageJson: any,
            ): boolean {
              return (
                packageJson.devDependencies?.[plugin.name] != null ||
                packageJson.dependencies?.[plugin.name] != null
              );
            };
          }
          return plugin;
        },
      ),
    ])
  ).filter((plugin) => {
    if (
      !plugin.devDependencies ||
      Object.keys(plugin.devDependencies).length === 0
    )
      // If the additional dependencies are not present, it is not a plugin installer.
      return false;
    if (!plugin.eslintConfig && !plugin.eslintLegacyConfig)
      // If the additional config is not present, it is not a plugin installer.
      return false;
    return true;
  });
  for (const plugin of list.sort(({ name: a }, { name: b }) =>
    customCompare(a, b),
  )) {
    allPlugins[plugin.name] = plugin;
  }
  return allPlugins;
}

function convertToName(file: string) {
  return file.replace(/^\.\//, "").split(/[/\\]/u)[1].replace(/^_/, ".");
}
