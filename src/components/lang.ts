export type Language =
  | "javascript"
  | "typescript"
  | "json"
  | "html"
  | "markdown"
  | "svelte"
  | "astro"
  | "yaml";
export function getLang(fileName: string): Language {
  if (
    fileName.endsWith(".ts") ||
    fileName.endsWith(".tsx") ||
    fileName.endsWith(".mts") ||
    fileName.endsWith(".cts")
  )
    return "typescript";
  if (
    fileName.endsWith(".json") ||
    fileName.endsWith(".json5") ||
    fileName.endsWith(".jsonc")
  )
    return "json";
  if (fileName.endsWith(".yml") || fileName.endsWith(".yaml")) return "yaml";
  if (fileName.endsWith(".html") || fileName.endsWith(".vue")) return "html";
  if (fileName.endsWith(".md")) return "markdown";
  if (fileName.endsWith(".svelte")) return "svelte";
  if (fileName.endsWith(".astro")) return "astro";
  return "javascript";
}
