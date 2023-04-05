import type { Component } from "vue";

export type Example = {
  name: string;
  description?: string | Component;
  files: Record<string, string>;
};

let allExamples: Record<string, Example> | null = null;

export async function loadExamples(): Promise<Record<string, Example>> {
  if (allExamples) {
    return allExamples;
  }
  allExamples = {};
  const examplesMap: Record<string, Example> = {};

  const list = await Promise.all([
    ...Object.entries(import.meta.glob("./**/*.ts")).map(
      async ([fileName, content]) => {
        const val = (await content()) as {
          default?: any;
          name?: string;
          description?: string;
        };
        return {
          keys: convertToExampleKeys(fileName),
          content: val,
        };
      }
    ),
    ...Object.entries(
      import.meta.glob("./**/*.{txt,js}", {
        as: "raw",
      })
    ).map(async ([fileName, content]) => ({
      keys: convertToExampleKeys(fileName),
      content: await content(),
    })),
  ]);
  for (const { keys, content } of list) {
    const ex = (examplesMap[keys.name] ??= { name: keys.name, files: {} });
    if (keys.fileName === "meta" && typeof content === "object") {
      const meta = content;
      ex.name = meta.name || ex.name;
      ex.description = meta.description;
      continue;
    }
    ex.files[keys.fileName] =
      typeof content === "string"
        ? content
        : JSON.stringify(content.default ?? content, null, 2);
  }

  for (const ex of Object.values(examplesMap).sort(({ name: a }, { name: b }) =>
    a.localeCompare(b)
  )) {
    allExamples[ex.name] = ex;
  }
  return allExamples;
}

function convertToExampleKeys(file: string) {
  const keys = file
    .replace(/^\.\//, "")
    .split(/[/\\]/u)
    .map((n) => n.replace(/^_/, "."));

  const last = keys[keys.length - 1];
  const lastExtIndex = last.lastIndexOf(".");
  if (lastExtIndex !== -1) {
    const ext = last.slice(lastExtIndex);
    if (ext === ".ts" || ext === ".txt") {
      keys[keys.length - 1] = last.slice(0, lastExtIndex);
    }
  }

  return {
    name: keys[0],
    fileName: keys.slice(1).join("/"),
  };
}
