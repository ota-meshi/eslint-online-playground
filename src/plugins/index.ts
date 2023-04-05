export type Plugin = {
  name: string;
  description?: string;
  repo?: string;
  devDependencies: Record<string, string>;
  eslintConfig: {
    plugins?: string[];
    extends?: string[];
  };
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
        const plugin = (await content()) as Plugin;
        if (!plugin.name) {
          plugin.name = convertToName(fileName);
        }
        return plugin;
      }
    ),
  ]);
  for (const plugin of list.sort(({ name: a }, { name: b }) =>
    a.localeCompare(b)
  )) {
    allPlugins[plugin.name] = plugin;
  }
  return allPlugins;
}

function convertToName(file: string) {
  return file.replace(/^\.\//, "").split(/[/\\]/u)[0].replace(/^_/, ".");
}
