import type * as Yaml from "yaml";
import type { InstallPluginResult, Plugin } from "..";
import { alertAndLog } from "./error";

export async function installPluginForYaml(
  configText: string,
  plugin: Plugin
): Promise<InstallPluginResult> {
  const yaml = await import("yaml");

  try {
    const ast = yaml.parseDocument(configText);
    if (!yaml.isMap(ast.contents)) {
      alertAndLog("Failed to parse YAML. Failed to add new configuration.");
      return { error: true };
    }
    if (plugin.eslintConfig.plugins) {
      for (const p of plugin.eslintConfig.plugins) {
        addToSeq(yaml, ast.contents, "plugins", p);
      }
    }
    if (plugin.eslintConfig.extends) {
      for (const p of plugin.eslintConfig.extends) {
        addToSeq(yaml, ast.contents, "extends", p);
      }
    }

    return { text: ast.toString() };
  } catch (e) {
    // eslint-disable-next-line no-console -- ignore
    console.error(e);
    alertAndLog("Failed to parse YAML. Failed to add new configuration.");
    return { error: true };
  }
}

function addToSeq(
  yaml: typeof Yaml,
  config: Yaml.YAMLMap.Parsed,
  key: string,
  s: string
) {
  let target = config.get(key);
  if (!target) {
    target = new yaml.YAMLSeq() as Yaml.YAMLSeq.Parsed;
    config.set(new yaml.Scalar(key) as Yaml.Scalar.Parsed, target);
  } else if (!yaml.isSeq(target)) {
    throw new Error("Failed to parse YAML. Failed to add new configuration.");
  }
  if (target.items.some((item) => yaml.isScalar(item) && item.value === s)) {
    return;
  }
  target.items.push(new yaml.Scalar(s) as Yaml.Scalar.Parsed);
}
