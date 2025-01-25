import { decompress } from "./compress";
import { loadExamples } from "../examples";
import { loadFilesFromGitHub, parseGitHubURL } from "./load-files-from-github";
import { loadingWith } from "./loading";

type QueryAndHashData = { search?: string; hash?: string };

export async function toSources(
  queryAndHashData: QueryAndHashData,
): Promise<Record<string, string> | null> {
  if (!queryAndHashData) return null;

  let sources: Record<string, string> | null = null;
  if (queryAndHashData.hash) {
    sources = await parseHash(queryAndHashData.hash);
  }
  if (sources && queryAndHashData.search) {
    const params = new URLSearchParams(queryAndHashData.search);
    const overrideDeps = safeParseJSON(params.get("overrideDeps"));
    if (sources?.["package.json"] && overrideDeps) {
      const base = JSON.parse(sources["package.json"]);
      sources["package.json"] = JSON.stringify(
        {
          ...base,
          devDependencies: { ...base.devDependencies, ...overrideDeps },
        },
        null,
        2,
      );
    }
  }

  return sources;

  async function parseHash(hash: string) {
    const queryParam = decompress(hash);
    if (queryParam) {
      return queryParam as unknown as Record<string, string>;
    }
    if (!hash) {
      return null;
    }
    const name = decodeURIComponent(hash);
    return loadingWith(() => loadFiles(name));
  }
}

export function getQueryAndHashData(): QueryAndHashData {
  const url = new URL(window.location.href);
  return {
    search: url.search,
    hash: url.hash.startsWith("#") ? url.hash.slice(1) : url.hash,
  };
}

function safeParseJSON<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch (e) {
    // eslint-disable-next-line no-console -- Demo runtime
    console.warn(e);
  }
  return null;
}

async function loadFiles(name: string) {
  const githubData = parseGitHubURL(name);
  if (githubData) {
    return loadFilesFromGitHub(
      githubData.owner,
      githubData.repo,
      githubData.path,
      githubData.ref,
    );
  }
  const examples = await loadExamples();
  return examples[name]?.getFiles() ?? null;
}
