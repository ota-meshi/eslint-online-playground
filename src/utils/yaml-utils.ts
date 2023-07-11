import type * as Yaml from "yaml";

export function toYAMLContent(
  yaml: typeof Yaml,
  object: any,
): Yaml.Scalar | Yaml.YAMLMap<Yaml.Node, Yaml.Node> | Yaml.YAMLSeq<Yaml.Node> {
  if (!object || typeof object !== "object") {
    return new yaml.Scalar(object);
  }
  if (Array.isArray(object)) {
    const seq = new yaml.YAMLSeq<Yaml.Node>();
    seq.items.push(...object.map((o) => toYAMLContent(yaml, o)));
    return seq;
  }
  const map = new yaml.YAMLMap<Yaml.Node, Yaml.Node>();
  for (const [k, v] of Object.entries(object)) {
    map.set(toYAMLContent(yaml, k), toYAMLContent(yaml, v));
  }
  return map;
}
