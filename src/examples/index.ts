export type Example = {
  name: string;
  description?: string;
  files: Record<string, string>;
};

let allExamples: Record<string, Example> | null = null;

export async function loadExamples(): Promise<Record<string, Example>> {
  if (allExamples) {
    return allExamples;
  }
  allExamples = {};

  const list = await Promise.all([
    ...Object.entries(import.meta.glob("./**/*.ts")).map(
      async ([fileName, content]) => {
        const val = (await content()) as any;
        return [fileName, JSON.stringify(val.default || val, null, 2)] as const;
      }
    ),
    ...Object.entries(
      import.meta.glob("./**/*.!(ts)", {
        as: "raw",
      })
    )
      .filter(([fileName]) => !fileName.endsWith(".ts"))
      .map(async ([fileName, content]) => [fileName, await content()] as const),
  ]);
  for (const { keys, content } of list
    .map(([fileName, content]) => ({
      keys: convertToExampleKeys(fileName),
      content,
    }))
    .sort(({ keys: a }, { keys: b }) => a.name.localeCompare(b.name))) {
    const ex = (allExamples[keys.name] ??= { name: keys.name, files: {} });
    if (keys.fileName === "meta") {
      const meta = JSON.parse(content);
      ex.name = meta.name || ex.name;
      ex.description = meta.description;
      continue;
    }
    ex.files[keys.fileName] = content;
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
    keys[keys.length - 1] = last.slice(0, lastExtIndex);
  }

  return {
    name: keys[0],
    fileName: keys.slice(1).join("/"),
  };
}
