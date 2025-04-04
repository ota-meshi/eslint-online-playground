import type { Monaco } from "../monaco-editor";

export type Language =
  | "javascript"
  | "typescript"
  | "json"
  | "html"
  | "markdown"
  | "svelte"
  | "astro"
  | "yaml"
  | "toml"
  | "css"
  | "scss"
  | "stylus"
  | "cds";
const tsExtensions = [".ts", ".tsx", ".mts", ".cts"];
const jsonExtensions = [".json", ".json5", ".jsonc"];
const yamlExtensions = [".yml", ".yaml"];
const htmlExtensions = [".html", ".vue"];
const markdownExtensions = [".md", ".markdown"];
const stylusExtensions = [".stylus", ".styl"];

export function getLang(monaco: Monaco | null, fileName: string): Language {
  if (tsExtensions.some((ext) => fileName.endsWith(ext))) return "typescript";
  if (jsonExtensions.some((ext) => fileName.endsWith(ext))) return "json";
  if (yamlExtensions.some((ext) => fileName.endsWith(ext))) return "yaml";
  if (htmlExtensions.some((ext) => fileName.endsWith(ext))) return "html";
  if (markdownExtensions.some((ext) => fileName.endsWith(ext)))
    return "markdown";
  if (fileName.endsWith(".svelte")) return "svelte";
  if (fileName.endsWith(".astro")) return "astro";
  if (fileName.endsWith(".toml")) return "toml";

  if (fileName.endsWith(".css")) return "css";
  if (fileName.endsWith(".scss")) return "scss";
  if (stylusExtensions.some((ext) => fileName.endsWith(ext))) return "stylus";
  if (fileName.endsWith(".cds")) return "cds";
  if (monaco) {
    const lang = monaco.languages
      .getLanguages()
      .find((lang) => lang.extensions?.some((ext) => fileName.endsWith(ext)));
    if (lang) return lang.id as Language;
  }
  return "javascript";
}
