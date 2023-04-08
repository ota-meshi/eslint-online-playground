export type Language =
  | "javascript"
  | "typescript"
  | "json"
  | "html"
  | "markdown"
  | "svelte"
  | "astro"
  | "yaml"
  | "toml";
const tsExtensions = [".ts", ".tsx", ".mts", ".cts"];
const jsonExtensions = [".json", ".json5", ".jsonc"];
const yamlExtensions = [".yml", ".yaml"];
const htmlExtensions = [".html", ".vue"];
const markdownExtensions = [".md", ".markdown"];
export function getLang(fileName: string): Language {
  if (tsExtensions.some((ext) => fileName.endsWith(ext))) return "typescript";
  if (jsonExtensions.some((ext) => fileName.endsWith(ext))) return "json";
  if (yamlExtensions.some((ext) => fileName.endsWith(ext))) return "yaml";
  if (htmlExtensions.some((ext) => fileName.endsWith(ext))) return "html";
  if (markdownExtensions.some((ext) => fileName.endsWith(ext)))
    return "markdown";
  if (fileName.endsWith(".svelte")) return "svelte";
  if (fileName.endsWith(".astro")) return "astro";
  if (fileName.endsWith(".toml")) return "toml";
  return "javascript";
}
