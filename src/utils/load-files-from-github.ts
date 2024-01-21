import { loadingWith } from "./loading";

type File = { type: "file"; download_url: string; path: string };
type Dir = { type: "dir"; url: string };
type Response = (File | Dir)[] | File;
export function parseGitHubURL(
  url: string,
): { owner: string; repo: string; path: string; ref?: string } | null {
  const match1 =
    /^https?:\/\/github\.com\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/(?:blob|tree)\/(?<ref>[^/]+)\/(?<path>.+?)\/?$/u.exec(
      url,
    );
  if (match1) {
    const [, owner, repo, ref, path] = match1;
    return { owner, repo, ref, path };
  }
  const match2 =
    /^https?:\/\/github\.com\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/(?:blob|tree)\/(?<ref>[^/]+)\/?$/u.exec(
      url,
    );
  if (match2) {
    const [, owner, repo, ref] = match2;
    return { owner, repo, ref, path: "" };
  }
  const match3 =
    /^https?:\/\/github\.com\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/?$/u.exec(url);
  if (match3) {
    const [, owner, repo] = match3;
    return { owner, repo, path: "" };
  }
  return null;
}

export async function loadFilesFromGitHub(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<Record<string, string>> {
  const url = new URL(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
  );
  if (ref) {
    url.searchParams.set("ref", ref);
  }
  return loadingWith(() => loadFilesFromURL(url));
}

async function loadFilesFromURL(
  url: string | URL,
): Promise<Record<string, string>> {
  const response: Response = await fetch(url).then((res) => res.json());
  const result: Record<string, string> = {};
  await Promise.all(
    (Array.isArray(response) ? response : [response]).map(async (file) => {
      if (file.type === "file") {
        if (file.path === ".gitignore" || file.path.endsWith("/.gitignore"))
          return;
        result[file.path] = await fetch(file.download_url).then((res) =>
          res.text(),
        );
      } else if (file.type === "dir") {
        Object.assign(result, await loadFilesFromURL(file.url));
      }
    }),
  );
  return result;
}
