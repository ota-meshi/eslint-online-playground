import { customCompare } from "../utils/compare";

export type Plugin = {
  name: string;
  description?: string;
  repo?: string;
  devDependencies: Record<string, string>;
  eslintConfig: {
    plugins?: string[];
    extends?: string[];
    overrides?: {
      files: string[];
      parser?: string;
    }[];
  };
  hasInstalled: (packageJson: any) => boolean;
};

export * from "./installer";

let allPlugins: Record<string, Plugin> | null = null;

export async function loadPlugins(): Promise<Record<string, Plugin>> {
  if (allPlugins) {
    return allPlugins;
  }
  allPlugins = {};

  const list = await Promise.all([
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
  ]);
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
