import type * as Yaml from "yaml";
import type { ConfigInstallPluginResult, Plugin } from "..";
import { alertAndLog } from "./error";
import { toYAMLContent } from "../../utils/yaml-utils";

export async function installPluginForYaml(
  configText: string,
  plugins: Plugin[],
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
  config: Yaml.YAMLMap<Yaml.Node, Yaml.Node | null>,
  key: string,
  values: string[],
) {
  const target = config.get(key);
  if (!target) {
    config.set(
      toYAMLContent(yaml, key),
      toYAMLContent(yaml, [...new Set(values)]),
    );
    return;
  }
  const seq = toSeqNode(yaml, target);
  const arrayValueJSONs = new Set(
    seq.items.map((v) => JSON.stringify(v.toJSON())),
  );
  seq.items.push(
    ...values
      .filter((v) => !arrayValueJSONs.has(JSON.stringify(v)))
      .map((v) => toYAMLContent(yaml, v)),
  );
  config.set(toYAMLContent(yaml, key), seq);
}

function margeOverride(
  yaml: typeof Yaml,
  config: Yaml.YAMLMap<Yaml.Node, Yaml.Node | null>,
  override: {
    files: string[];
    parser?: string;
  },
) {
  const overrides = config.get("overrides");
  if (!overrides) {
    config.set(
      toYAMLContent(yaml, "overrides"),
      toYAMLContent(yaml, [override]),
    );
    return;
  }
  const seq = toSeqNode(yaml, overrides);
  const element = seq.items.find((e) => {
    const filesValue = [e.toJSON()?.files].flat();
    return JSON.stringify(filesValue) === JSON.stringify(override.files);
  });
  if (element && yaml.isMap(element)) {
    for (const [key, value] of Object.entries(override)) {
      if (key === "files") continue;
      element.set(toYAMLContent(yaml, key), toYAMLContent(yaml, value));
    }
  } else {
    seq.items.push(toYAMLContent(yaml, override));
    config.set(toYAMLContent(yaml, "overrides"), seq);
  }
}

function toSeqNode(yaml: typeof Yaml, value: unknown): Yaml.YAMLSeq<Yaml.Node> {
  if (yaml.isSeq(value)) {
    return value as Yaml.YAMLSeq<Yaml.Node>;
  }
  const node = new yaml.YAMLSeq<Yaml.Node>();
  node.items.push(yaml.isNode(value) ? value : toYAMLContent(yaml, value));
  return node;
}
