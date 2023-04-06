import type { InstallPluginResult, Plugin } from "..";
import { alertAndLog } from "./error";
import type { Linter } from "eslint";

export function installPluginForJson(
  configText: string,
  plugin: Plugin
): InstallPluginResult {
  try {
    const config: Linter.Config = JSON.parse(configText);
    if (plugin.eslintConfig.plugins)
      config.plugins = [
        ...new Set([
          ...[config.plugins]
            .flat()
            .filter((e): e is NonNullable<typeof e> => Boolean(e)),
          ...plugin.eslintConfig.plugins,
        ]),
      ];
    if (plugin.eslintConfig.extends)
      config.extends = [
        ...new Set([
          ...[config.extends]
            .flat()
            .filter((e): e is NonNullable<typeof e> => Boolean(e)),
          ...(plugin.eslintConfig.extends ?? []),
        ]),
      ];
    if (plugin.eslintConfig.overrides) {
      if (config.overrides) {
        for (const override of plugin.eslintConfig.overrides) {
          const target = config.overrides.find((o) => {
            if (
              o.files &&
              JSON.stringify(override.files) ===
                JSON.stringify([o.files].flat())
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
      } else {
        config.overrides = plugin.eslintConfig.overrides;
      }
    }
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
