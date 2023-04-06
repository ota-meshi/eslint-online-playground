import type { Plugin } from "..";
import type { ConfigFileName } from "../../utils/eslint-info";
import { alertAndLog } from "./error";
import { installPluginForYaml } from "./yaml";
import { installPluginForCJS, installPluginForMJS } from "./js";
import { installPluginForJson } from "./json";

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
    return installPluginForJson(configText, plugin);
  }
  if (configFileName === ".eslintrc.yaml") {
    return installPluginForYaml(configText, plugin);
  }
  if (configFileName === ".eslintrc.js") {
    return installPluginForCJS(configText, plugin);
  }
  if (configFileName === "eslint.config.js") {
    return installPluginForMJS(configText, plugin);
  }

  alertAndLog(`Cannot install plugin for config file name: ${configFileName}`);
  return {
    error: true,
  };
}
