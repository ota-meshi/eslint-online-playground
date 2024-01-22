import { loadingWith, messageWith } from "./loading";

type ContentFile = { type: "file"; download_url: string; path: string };
type ContentDir = { type: "dir"; url: string };
type ContentsResponse = (ContentFile | ContentDir)[] | ContentFile;
type RepoResponse = { default_branch: string };
type TreeFile = { type: "blob"; url: string; path: string };
type TreeDir = { type: "tree"; url: string; path: string };
type TreeResponse = { tree: (TreeFile | TreeDir)[]; truncated: boolean };
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
  return loadingWith(async () => {
    try {
      return await loadFilesFromGitHubTreesAPI(owner, repo, path, ref);
    } catch {
      // ignore
    }
    return loadFilesFromGitHubContentsAPI(owner, repo, path, ref);
  });
}

async function loadFilesFromGitHubTreesAPI(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<Record<string, string>> {
  const treeSha =
    ref ||
    (await (async () => {
      const res: RepoResponse = await sequentialFetch(
        `https://api.github.com/repos/${owner}/${repo}`,
      ).then((res) => res.json());
      return res.default_branch;
    })());
  const response: TreeResponse = await sequentialFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=true`,
  ).then((res) => res.json());
  if (response.truncated) {
    throw new Error("Tree is too large");
  }
  const result: Record<string, string> = {};
  const prefix = path ? `${path}/` : "";
  await Promise.all(
    response.tree.map(async (file) => {
      if (file.type === "blob") {
        if (!file.path.startsWith(prefix)) return;
        if (
          // Ignore .gitignore and binary files
          file.path === ".gitignore" ||
          file.path.endsWith("/.gitignore") ||
          maybeBinaryFile(file.path)
        )
          return;
        result[file.path] = await sequentialFetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/${treeSha}/${file.path}`,
        ).then((res) => res.text());
      }
    }),
  );
  return result;
}

async function loadFilesFromGitHubContentsAPI(
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
  return loadFilesFromGitHubContentsURL(url);
}

async function loadFilesFromGitHubContentsURL(
  url: string | URL,
): Promise<Record<string, string>> {
  const response: ContentsResponse = await sequentialFetch(url).then((res) =>
    res.json(),
  );
  const result: Record<string, string> = {};
  await Promise.all(
    (Array.isArray(response) ? response : [response]).map(async (file) => {
      if (file.type === "file") {
        if (
          // Ignore .gitignore and binary files
          file.path === ".gitignore" ||
          file.path.endsWith("/.gitignore") ||
          maybeBinaryFile(file.path)
        )
          return;
        result[file.path] = await sequentialFetch(file.download_url).then(
          (res) => res.text(),
        );
      } else if (file.type === "dir") {
        Object.assign(result, await loadFilesFromGitHubContentsURL(file.url));
      }
    }),
  );
  return result;
}

function maybeBinaryFile(filePath: string): boolean {
  const EXTS = [
    ".3g2",
    ".3gp",
    ".aac",
    ".aac",
    ".apng",
    ".avif",
    ".bmp",
    ".cur",
    ".flac",
    ".flac",
    ".gif",
    ".ico",
    ".jfif",
    ".jpeg",
    ".jpg",
    ".m1a",
    ".m1v",
    ".m2a",
    ".m2v",
    ".m4p",
    ".mov",
    ".mp1",
    ".mp2",
    ".mp3",
    ".mp4",
    ".mpa",
    ".mpe",
    ".mpeg",
    ".mpg",
    ".mpv",
    ".oga",
    ".ogg",
    ".ogm",
    ".ogv",
    ".ogx",
    ".opus",
    ".pjp",
    ".pjpeg",
    ".png",
    ".spx",
    ".tif",
    ".tiff",
    ".ttf",
    ".wav",
    ".webm",
    ".webp",
    ".woff",
    ".woff2",
  ];
  return EXTS.some((ext) => filePath.endsWith(ext));
}

let queue: Promise<any> = Promise.resolve();

function sequentialFetch(url: string | URL): Promise<any> {
  queue = queue.then(
    () => messageWith(`Request to\n${url}`, () => fetch(url)),
    () => messageWith(`Request to\n${url}`, () => fetch(url)),
  );
  return queue;
}
