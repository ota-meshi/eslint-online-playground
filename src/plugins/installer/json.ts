import type { ConfigInstallPluginResult, Plugin } from "..";
import { prettyStringify } from "../../utils/json-utils";
import { alertAndLog } from "./error";
import type { Linter } from "eslint";

export function installPluginForJson(
  configText: string,
  plugins: Plugin[]
): ConfigInstallPluginResult {
  let config: Linter.Config;
  try {
    config = JSON.parse(configText);
  } catch {
    alertAndLog("Failed to parse JSON. Failed to add new configuration.");
    return { error: true };
  }
  for (const plugin of plugins) {
    for (const key of ["plugins", "extends"] as const) {
      const values = plugin.eslintConfig[key];
      if (values)
        config[key] = [
          ...new Set([
            ...[config[key]]
              .flat()
              .filter((e): e is NonNullable<typeof e> => Boolean(e)),
            ...values,
          ]),
        ];
    }
    if (plugin.eslintConfig.overrides) {
      if (!config.overrides) {
        config.overrides = [];
      }
      for (const override of plugin.eslintConfig.overrides) {
        const target = config.overrides.find((o) => {
          if (
            JSON.stringify(override.files) === JSON.stringify([o?.files].flat())
          ) {
            return true;
          }
          return false;
        });
        if (target) {
          Object.assign(target, override);
        } else {
          config.overrides.push(override);
        }
      }
    }
  }
  return {
    configText: prettyStringify(config),
  };
}
