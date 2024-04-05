import type { Component } from "vue";
import { prettyStringify } from "../utils/json-utils";
import { customCompare } from "../utils/compare";
import {
  loadFilesFromGitHub,
  parseGitHubURL,
} from "../utils/load-files-from-github";

export type Example = {
  name: string;
  description?: string | Component;
  getFiles(): Promise<Record<string, string>>;
};

let allExamples: Record<string, Example> | null = null;

export async function loadExamples(): Promise<Record<string, Example>> {
  if (allExamples) {
    return allExamples;
  }
  allExamples = {};

  type ExampleTS = {
    default?: any;
    name?: string;
    description?: string;
    githubResources?: string;
  };

  const list = await Promise.all([
    ...Object.entries(import.meta.glob("./**/*.ts")).map(
      async ([fileName, content]) => {
        const val = (await content()) as ExampleTS;
        return {
          keys: convertToExampleKeys(fileName),
          content: val,
        };
      },
    ),
    ...Object.entries(
      import.meta.glob("./**/*.{txt,js,cds}", {
        as: "raw",
      }),
    ).map(async ([fileName, content]) => ({
      keys: convertToExampleKeys(fileName),
      content: await content(),
    })),
  ]);

  const examplesMap: Record<
    string,
    { name: string; meta?: ExampleTS; resources: Record<string, string> }
  > = {};
  for (const { keys, content } of list) {
    const ex = (examplesMap[keys.name] ??= { name: keys.name, resources: {} });
    if (keys.fileName === "meta" && typeof content === "object") {
      const meta = content;
      ex.name = meta.name || ex.name;
      ex.meta = meta;
      continue;
    }
    ex.resources[keys.fileName] =
      typeof content === "string"
        ? content
        : prettyStringify(content.default ?? content);
  }

  for (const ex of Object.values(examplesMap).sort(({ name: a }, { name: b }) =>
    customCompare(a, b),
  )) {
    let loaded = false;
    allExamples[ex.name] = {
      name: ex.name,
      description: ex.meta?.description,
      async getFiles() {
        if (ex.meta?.githubResources && !loaded) {
          loaded = true;
          const github = parseGitHubURL(ex.meta.githubResources);
          if (github)
            Object.assign(
              ex.resources,
              await loadFilesFromGitHub(
                github.owner,
                github.repo,
                github.path,
                github.ref,
              ),
            );
        }
        return Promise.resolve(ex.resources);
      },
    };
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
