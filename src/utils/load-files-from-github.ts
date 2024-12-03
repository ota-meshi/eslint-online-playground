import { loadingWith, messageWith } from "./loading";

type ContentFile = { type: "file"; download_url: string; path: string };
type ContentDir = { type: "dir"; url: string };
type ContentsResponse = (ContentFile | ContentDir)[] | ContentFile;
type RepoResponse = { default_branch: string };
type TreeFile = { type: "blob"; url: string; path: string };
type TreeDir = { type: "tree"; url: string; path: string };
type TreeResponse = { tree: (TreeFile | TreeDir)[]; truncated: boolean };
type RateLimitResponse = { rate: { limit: number; remaining: number } };

type UnGhRepoResponse = { repo: { defaultBranch: string } };
type UnGhFile = { path: string };
type UnGhFilesResponse = { files: UnGhFile[] };
type UnGhFileResponse = { file: { contents: string } };
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
    return (
      (await loadFilesFromGitHubWithUnGh(owner, repo, path, ref)) ??
      (await loadFilesFromGitHubTreesAPI(owner, repo, path, ref)) ??
      loadFilesFromGitHubContentsAPI(owner, repo, path, ref)
    );
  });
}

async function loadFilesFromGitHubWithUnGh(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<Record<string, string> | null> {
  try {
    const treeSha =
      ref ||
      (await (async () => {
        const res: UnGhRepoResponse = await fetchWithMessage(
          `https://ungh.cc/repos/${owner}/${repo}`,
        ).then((res) => res.json());
        return res.repo.defaultBranch;
      })());
    if (!treeSha) return null;
    const response: UnGhFilesResponse = await fetchWithMessage(
      `https://ungh.cc/repos/${owner}/${repo}/files/${treeSha}`,
    ).then((res) => res.json());
    const result: Record<string, string> = {};
    const prefix = path ? `${path}/` : "";
    await Promise.all(
      response.files.map(async (file) => {
        if (!file.path.startsWith(prefix)) return;
        if (ignore(file)) return;
        const fileResponse: UnGhFileResponse = await fetchWithMessage(
          `https://ungh.cc/repos/${owner}/${repo}/files/${treeSha}/${file.path}`,
        ).then((res) => res.json());

        result[file.path] = fileResponse.file.contents;
      }),
    );
    return result;
  } catch (e) {
    // eslint-disable-next-line no-console -- debug
    console.error(e);
    return null;
  }
}

async function loadFilesFromGitHubTreesAPI(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<Record<string, string> | null> {
  const treeSha =
    ref ||
    (await (async () => {
      const res: RepoResponse = await fetchForGitHub(
        `https://api.github.com/repos/${owner}/${repo}`,
      ).then((res) => res.json());
      return res.default_branch;
    })());
  const response: TreeResponse = await fetchForGitHub(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=true`,
  ).then((res) => res.json());
  if (response.truncated) {
    return null;
  }
  const result: Record<string, string> = {};
  const prefix = path ? `${path}/` : "";
  await Promise.all(
    response.tree.map(async (file) => {
      if (file.type === "blob") {
        if (!file.path.startsWith(prefix)) return;
        if (ignore(file)) return;
        result[file.path] = await fetchForGitHub(
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
  const response: ContentsResponse = await fetchForGitHub(url).then((res) =>
    res.json(),
  );
  const result: Record<string, string> = {};
  await Promise.all(
    (Array.isArray(response) ? response : [response]).map(async (file) => {
      if (file.type === "file") {
        if (ignore(file)) return;
        result[file.path] = await fetchForGitHub(file.download_url).then(
          (res) => res.text(),
        );
      } else if (file.type === "dir") {
        Object.assign(result, await loadFilesFromGitHubContentsURL(file.url));
      }
    }),
  );
  return result;
}

function ignore(file: ContentFile | TreeFile | UnGhFile): boolean {
  return (
    // Ignore .gitignore, .github, .vscode, .devcontainer
    // and binary files
    file.path === ".gitignore" ||
    file.path.endsWith("/.gitignore") ||
    file.path.startsWith(".github/") ||
    file.path.startsWith(".vscode/") ||
    file.path.startsWith(".devcontainer/") ||
    maybeBinaryFile(file.path)
  );
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

let githubToken = "";

async function fetchWithMessage(url: string | URL): Promise<Response> {
  queue = queue.then(() => messageWith(`Request to\n${url}`, nextFetch));
  return queue;

  function nextFetch() {
    return fetch(url).then(async (res) => {
      if (res.status !== 200) {
        throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
      }
      return res;
    });
  }
}

async function fetchForGitHub(url: string | URL): Promise<Response> {
  // debug
  // if (!githubToken) {
  //   await retryFetchForGitHubWithRequestToken(
  //     { rate: { limit: 2, remaining: 0 } },
  //     new Error(`Failed to fetch ${url}: ${2}`),
  //   );
  // }
  queue = queue.then(() => messageWith(`Request to\n${url}`, nextFetch));
  return queue;

  function nextFetch() {
    return (
      githubToken
        ? fetch(url, {
            headers: {
              Authorization: `Bearer ${githubToken}`,
            },
          })
        : fetch(url)
    ).then(async (res) => {
      if (res.status !== 200) {
        if (`${res.status}`.startsWith("4")) {
          const rlRes: RateLimitResponse = await fetch(
            `https://api.github.com/rate_limit`,
          ).then((res) => {
            if (res.status !== 200) {
              throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
            }
            return res.json();
          });
          if (rlRes.rate.remaining > 0) {
            throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
          }
          return retryFetchForGitHubWithRequestToken(
            rlRes,
            new Error(`Failed to fetch ${url}: ${res.statusText}`),
          );
        }

        throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
      }
      return res;
    });
  }

  function retryFetchForGitHubWithRequestToken(
    rlRes: RateLimitResponse,
    error: Error,
  ): Promise<Response> {
    const dialog = document.createElement("dialog");
    dialog.style.display = "flex";
    dialog.style.flexDirection = "column";
    dialog.style.alignItems = "stretch";
    // Message element
    dialog.innerHTML = `<div style="text-align: center; background-color: #fff9">Rate limit exceeded. (${rlRes.rate.remaining}/${rlRes.rate.limit})<br>
You may be able to continue processing by entering <a href="https://docs.github.com/ja/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" target="_blank">GITHUB_TOKEN</a>.
</div>
`;

    // Input
    const input = document.createElement("input");
    dialog.appendChild(input);
    const comment = document.createElement("div");
    comment.style.fontSize = "70%";
    comment.innerHTML = `We do not store it or use it for any purpose other than calling GitHub API,<br>
but IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM.<br>
See also <a href="https://github.com/ota-meshi/eslint-online-playground/blob/main/LICENSE" target="_blank">LICENSE</a>.
`;
    dialog.appendChild(comment);
    // OK button
    const button = document.createElement("button");
    button.style.alignSelf = "flex-start";
    button.textContent = "OK";
    dialog.appendChild(button);
    document.body.appendChild(dialog);

    dialog.showModal();

    return new Promise((resolve, reject) => {
      button.addEventListener("click", () => {
        if (input.value) {
          dialog.close();
          document.body.removeChild(dialog);
          githubToken = input.value;
          resolve(nextFetch());
        }
      });
      dialog.addEventListener("cancel", () => reject(error));
    });
  }
}
