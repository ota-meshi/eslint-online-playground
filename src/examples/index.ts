import { type Component } from "vue";
import { prettyStringify } from "../utils/json-utils";
import { customCompare } from "../utils/compare";
import {
  loadFilesFromGitHub,
  parseGitHubURL,
} from "../utils/load-files/from-github";

export type Example = {
  name: string;
  description?: string | Component;
  getFiles(): Promise<Record<string, string>>;
};

let allExamples: Promise<Record<string, Example>> | null = null;

export async function loadExamples(): Promise<Record<string, Example>> {
  if (allExamples) {
    return allExamples;
  }
  return (allExamples = loadExamplesWithoutCache());
}

async function loadExamplesWithoutCache(): Promise<Record<string, Example>> {
  type ExampleTS = {
    default?: any;
    name?: string;
    description?: string;
    githubResources?: string;
  };

  const resourceList = [
    ...Object.entries(import.meta.glob("./**/*.ts")).map(
      ([fileName, loadContent]) => {
        return {
          keys: convertToExampleKeys(fileName),
          loadContent: () => loadContent() as Promise<ExampleTS>,
        };
      },
    ),
    ...Object.entries(
      import.meta.glob<{ default: string }>("./**/*.{txt,js,cds,csv}", {
        query: "?raw",
      }),
    ).map(([fileName, loadContent]) => ({
      keys: convertToExampleKeys(fileName),
      loadContent: () => loadContent().then((m) => m.default),
    })),
  ];

  const examplesMap: Record<
    string,
    {
      name: string;
      meta?: ExampleTS;
      resources: Record<string, () => Promise<string>>;
    }
  > = {};

  await Promise.all(
    resourceList.map(async ({ keys, loadContent }) => {
      const ex = (examplesMap[keys.name] ??= {
        name: keys.name,
        resources: {},
      });
      if (keys.fileName === "meta") {
        const metaContent = await loadContent();
        if (typeof metaContent === "object") {
          const meta = metaContent;
          ex.name = meta.name || ex.name;
          ex.meta = meta;
          return;
        }
      }
      ex.resources[keys.fileName] = () =>
        loadContent().then((content) =>
          typeof content === "string"
            ? content
            : prettyStringify(content.default ?? content),
        );
    }),
  );

  const examples: Record<string, Example> = {};
  for (const ex of Object.values(examplesMap).sort(({ name: a }, { name: b }) =>
    customCompare(a, b),
  )) {
    let files: Promise<[string, string][]> | null = null;

    async function loadFiles() {
      if (ex.meta?.githubResources) {
        const github = parseGitHubURL(ex.meta.githubResources);
        if (github)
          for (const [name, resource] of Object.entries(
            await loadFilesFromGitHub(
              github.owner,
              github.repo,
              github.path,
              github.ref,
            ),
          )) {
            ex.resources[name] = () => Promise.resolve(resource);
          }
      }
      return Promise.all(
        Object.entries(ex.resources).map(
          async ([name, loadContent]) =>
            [name, await loadContent()] as [string, string],
        ),
      );
    }

    examples[ex.name] = {
      name: ex.name,
      description: ex.meta?.description,
      async getFiles() {
        if (!files) {
          files = loadFiles();
        }
        return Object.fromEntries(await files);
      },
    };
  }
  return examples;
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
