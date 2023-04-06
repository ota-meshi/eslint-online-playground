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
    if (plugin.eslintConfig.overrides) {
      for (const override of plugin.eslintConfig.overrides) {
        margeOverride(yaml, ast.contents, override);
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
  const target = config.get(key);
  if (!target) {
    config.set(
      new yaml.Scalar(key) as Yaml.Scalar.Parsed,
      toYamlAst(yaml, [s])
    );
    return;
  }
  if (yaml.isScalar(target)) {
    if (target.value === s) {
      return;
    }
    config.set(
      new yaml.Scalar(key) as Yaml.Scalar.Parsed,
      toYamlAst(yaml, [target.value, s])
    );
    return;
  }
  if (yaml.isSeq(target)) {
    if (target.items.some((item) => yaml.isScalar(item) && item.value === s)) {
      return;
    }
    target.items.push(toYamlAst(yaml, s));
    return;
  }
  throw new Error("Failed to parse YAML. Failed to add new configuration.");
}

function margeOverride(
  yaml: typeof Yaml,
  config: Yaml.YAMLMap.Parsed,
  override: {
    files: string[];
    parser?: string;
  }
) {
  const overrides = config.get("overrides");
  if (!overrides) {
    config.set(
      new yaml.Scalar("overrides") as Yaml.Scalar.Parsed,
      toYamlAst(yaml, [override])
    );
    return;
  }
  if (!yaml.isSeq(overrides)) {
    throw new Error("Failed to parse YAML. Failed to add new configuration.");
  }
  const target = overrides.items.find((o): o is Yaml.YAMLMap.Parsed => {
    if (!yaml.isMap(o)) {
      return false;
    }
    const files = o.get("files");
    if (yaml.isSeq(files)) {
      if (files.items.length !== override.files.length) {
        return false;
      }

      if (
        files.items.every((n, i) => {
          return yaml.isScalar(n) && n.value === override.files[i];
        })
      ) {
        return true;
      }
      return false;
    }
    if (yaml.isScalar(files)) {
      if (override.files.length !== 1) {
        return false;
      }

      if (files.value === override.files[0]) {
        return true;
      }
      return false;
    }
    return false;
  });

  if (target) {
    for (const [key, val] of Object.values(override)) {
      const valAst = toYamlAst(yaml, val);
      target.set(new yaml.Scalar(key) as Yaml.Scalar.Parsed, valAst);
    }
    return;
  }
  overrides.items.push(toYamlAst(yaml, override));
}

function toYamlAst(yaml: typeof Yaml, obj: any) {
  return yaml.parseDocument(yaml.stringify(obj)).contents!;
}
