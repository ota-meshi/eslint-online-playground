import type * as Yaml from "yaml";
import type { ConfigInstallPluginResult, Plugin } from "..";
import { alertAndLog } from "./error";

export async function installPluginForYaml(
  configText: string,
  plugins: Plugin[]
): Promise<ConfigInstallPluginResult> {
  const yaml = await import("yaml");

  try {
    const ast = yaml.parseDocument(configText);

    if (!yaml.isMap(ast.contents)) {
      alertAndLog("Failed to parse YAML. Failed to add new configuration.");
      return { error: true };
    }
    for (const plugin of plugins) {
      for (const key of ["plugins", "extends"] as const) {
        const values = plugin.eslintConfig[key];
        if (values) {
          addToSeq(yaml, ast.contents, key, values);
        }
      }
      if (plugin.eslintConfig.overrides) {
        for (const override of plugin.eslintConfig.overrides) {
          margeOverride(yaml, ast.contents, override);
        }
      }
    }

    return { configText: ast.toString() };
  } catch (e) {
    // eslint-disable-next-line no-console -- ignore
    console.error(e);
    alertAndLog("Failed to parse YAML. Failed to add new configuration.");
    return { error: true };
  }
}

function addToSeq(
  yaml: typeof Yaml,
  config: Yaml.YAMLMap,
  key: string,
  values: string[]
) {
  const target = config.get(key);
  if (!target) {
    config.set(key, [...new Set(values)]);
    return;
  }
  const array = [yaml.isNode(target) ? target.toJSON() : target].flat();
  config.set(key, [...new Set([...array, ...values])]);
}

function margeOverride(
  yaml: typeof Yaml,
  config: Yaml.YAMLMap,
  override: {
    files: string[];
    parser?: string;
  }
) {
  const overrides = config.get("overrides");
  if (!overrides) {
    config.set("overrides", [override]);
    return;
  }
  const array = [
    yaml.isNode(overrides) ? overrides.toJSON() : overrides,
  ].flat();
  const element = array.find((e) => {
    const filesValue = [e?.files].flat();
    return JSON.stringify(filesValue) === JSON.stringify(override.files);
  });
  if (element) {
    Object.assign(element, override);
  } else {
    array.push(override);
  }
  config.set("overrides", array);
}
