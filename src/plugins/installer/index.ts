import type { Plugin } from "..";
import type { ConfigFileName } from "../../utils/eslint-info";
import { alertAndLog } from "./error";
import { installPluginForYaml } from "./yaml";
import { installPluginForCJS, installPluginForMJS } from "./js";
import { installPluginForJson } from "./json";
import { prettyStringify } from "../../utils/json-utils";

export type InstallPluginResult =
  | {
      error?: false;
      packageJson: string;
      configText: string;
    }
  | { error: true; packageJson?: string; configText?: string };
export type ConfigInstallPluginResult =
  | {
      error?: false;
      configText: string;
    }
  | { error: true; configText?: string };

export async function installPlugin(
  packageJson: string,
  configText: string,
  configFileName: ConfigFileName,
  plugins: Plugin[],
): Promise<InstallPluginResult> {
  let packageJsonObject: { devDependencies?: Record<string, string> };
  try {
    packageJsonObject = JSON.parse(packageJson);
  } catch (_e) {
    alertAndLog(`Cannot parse package.json`);
    return {
      error: true,
    };
  }
  if (
    !packageJsonObject ||
    typeof packageJsonObject !== "object" ||
    Array.isArray(packageJsonObject)
  ) {
    alertAndLog(`Cannot parse package.json`);
    return {
      error: true,
    };
  }
  for (const plugin of plugins) {
    packageJsonObject.devDependencies = {
      ...packageJsonObject.devDependencies,
      ...plugin.devDependencies,
    };
  }
  const packageJsonResult = prettyStringify(packageJsonObject);
  try {
    if (configFileName === ".eslintrc.json") {
      return {
        ...installPluginForJson(configText, plugins),
        packageJson: packageJsonResult,
      };
    }
    if (configFileName === ".eslintrc.yaml") {
      return {
        ...(await installPluginForYaml(configText, plugins)),
        packageJson: packageJsonResult,
      };
    }
    if (configFileName === ".eslintrc.js") {
      return {
        ...(await installPluginForCJS(configText, plugins)),
        packageJson: packageJsonResult,
      };
    }
    if (configFileName === "eslint.config.js") {
      return {
        ...(await installPluginForMJS(configText, plugins)),
        packageJson: packageJsonResult,
      };
    }
  } catch (_e) {
    return {
      error: true,
    };
  }

  alertAndLog(`Cannot install plugin for config file name: ${configFileName}`);
  return {
    error: true,
  };
}
