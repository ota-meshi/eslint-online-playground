import { decompress } from "./compress";
import { loadExamples } from "../examples";
import { loadFilesFromGitHub, parseGitHubURL } from "./load-files-from-github";
import { loadingWith } from "./loading";

export async function toSources(
  hashData: string,
): Promise<Record<string, string> | null> {
  const queryParam = decompress(hashData);
  if (queryParam) {
    return queryParam as unknown as Record<string, string>;
  }
  if (!hashData) {
    return null;
  }
  const name = decodeURIComponent(hashData);
  return loadingWith(() => loadFiles(name));
}

export function getHashData(): string {
  return window.location.hash.slice(window.location.hash.indexOf("#") + 1);
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
