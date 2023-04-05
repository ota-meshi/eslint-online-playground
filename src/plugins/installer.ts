import type { Plugin } from ".";
import type { ConfigFileName } from "../utils/eslint-info";

export function installPlugin(
  configText: string,
  configFileName: ConfigFileName,
  plugin: Plugin
): string {
  if (configFileName === ".eslintrc.json") {
    const config = JSON.parse(configText);
    if (plugin.eslintConfig.plugins)
      config.plugins = [
        ...new Set([
          ...[config.plugins].flat().filter(Boolean),
          ...plugin.eslintConfig.plugins,
        ]),
      ];
    if (plugin.eslintConfig.extends)
      config.extends = [
        ...new Set([
          ...[config.extends].flat().filter(Boolean),
          ...(plugin.eslintConfig.extends ?? []),
        ]),
      ];
    return JSON.stringify(config, null, 2);
  }
  console.log(`Cannot install plugin for config file name: ${configFileName}`);
  return configText;
}
