import type { Plugin } from "..";
import type { ConfigFileName } from "../../utils/eslint-info";
import { alertAndLog } from "./error";
import { installPluginForYaml } from "./yaml";
import { installPluginForCJS } from "./js";

export type InstallPluginResult =
  | {
      error?: false;
      text: string;
    }
  | { error: true };

export async function installPlugin(
  configText: string,
  configFileName: ConfigFileName,
  plugin: Plugin
): Promise<InstallPluginResult> {
  if (configFileName === ".eslintrc.json") {
    try {
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
      return {
        text: JSON.stringify(config, null, 2),
      };
    } catch (e) {
      // eslint-disable-next-line no-console -- ignore
      console.error(e);
      alertAndLog("Failed to parse JSON. Failed to add new configuration.");
      return { error: true };
    }
  }
  if (configFileName === ".eslintrc.yaml") {
    return installPluginForYaml(configText, plugin);
  }
  if (configFileName === ".eslintrc.js") {
    return installPluginForCJS(configText, plugin);
  }

  alertAndLog(`Cannot install plugin for config file name: ${configFileName}`);
  return {
    error: true,
  };
}
