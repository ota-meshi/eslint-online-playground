import type * as monaco from "monaco-editor";
export type Monaco = typeof monaco;
import { version as monacoVersion } from "monaco-editor/package.json";

let monacoPromise: Promise<Monaco> | null = null;

/** Load the Monaco editor object. */
export function loadMonaco(): Promise<Monaco> {
  return (
    monacoPromise ||
    (monacoPromise = (async () => {
      const monaco: Monaco = await loadModuleFromMonaco(
        "vs/editor/editor.main",
      );
      // monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      //   allowComments: true,
      //   trailingCommas: "ignore",
      // });

      // Turn off built-in validation.
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        validate: false,
      });
      // monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      //   validate: false,
      // });
      // monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      //   validate: false,
      // });
      // monaco.languages.css.cssDefaults.setOptions({
      //   validate: false,
      // });

      setupEnhancedLanguages(monaco);

      return monaco;
    })())
  );
}

let validateStateQueue = Promise.resolve();
export function enableBuiltinValidate({
  jsonAs,
}: {
  jsonAs: "json" | "jsonc";
}): void {
  validateStateQueue = validateStateQueue.then(async () => {
    const monaco = await loadMonaco();
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      validate: true,
    });
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      ...(jsonAs === "jsonc"
        ? { allowComments: true, trailingCommas: "ignore" }
        : {}),
    });
    monaco.languages.css.cssDefaults.setOptions({
      validate: true,
    });
  });
}

export function enableJsoncValidate(): void {
  validateStateQueue = validateStateQueue.then(async () => {
    const monaco = await loadMonaco();
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      validate: false,
    });
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: false,
    });
    monaco.languages.css.cssDefaults.setOptions({
      validate: false,
    });
  });
}

export function disableBuiltinValidate(): void {
  validateStateQueue = validateStateQueue.then(async () => {
    const monaco = await loadMonaco();
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      validate: false,
    });
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: false,
    });
    monaco.languages.css.cssDefaults.setOptions({
      validate: false,
    });
  });
}

async function loadModuleFromMonaco<T>(moduleName: string): Promise<T> {
  await setupMonaco();

  return new Promise((resolve) => {
    if (typeof window !== "undefined") {
      // @ts-expect-error -- global Monaco's require
      window.require([moduleName], (r: T) => {
        resolve(r);
      });
    }
  });
}

async function setupMonaco(): Promise<void> {
  if (typeof window !== "undefined") {
    const monacoScript =
      Array.from(document.head.querySelectorAll("script")).find(
        (script) =>
          script.src &&
          script.src.includes("monaco") &&
          script.src.includes("vs/loader"),
      ) ||
      // If the script tag that loads the Monaco editor is not found, insert the script tag.
      (await appendMonacoEditorScript());

    // @ts-expect-error -- global Monaco's require
    window.require.config({
      paths: {
        vs: monacoScript.src.replace(/\/vs\/.*$/u, "/vs"),
      },
    });
  }
}

/** Appends a script tag that loads the Monaco editor. */
async function appendMonacoEditorScript(): Promise<HTMLScriptElement> {
  let error = new Error();
  const urlList = [
    "https://cdn.jsdelivr.net/npm/monaco-editor/dev/vs/loader.min.js",
    "https://unpkg.com/monaco-editor@latest/min/vs/loader.js",
  ];

  if (typeof monacoVersion !== "undefined") {
    urlList.unshift(
      `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${monacoVersion}/min/vs/loader.min.js`,
      `https://cdn.jsdelivr.net/npm/monaco-editor@${monacoVersion}/dev/vs/loader.min.js`,
      `https://unpkg.com/monaco-editor/${monacoVersion}/min/vs/loader.min.js`,
    );
  }
  for (const url of urlList) {
    try {
      return await appendScript(url);
    } catch (e: unknown) {
      // eslint-disable-next-line no-console -- OK
      console.warn(`Failed to retrieve resource from ${url}`);
      error = e as Error;
    }
  }
  throw error;
}

/** Appends a script tag. */
async function appendScript(src: string): Promise<HTMLScriptElement> {
  const script = document.createElement("script");

  return new Promise((resolve, reject) => {
    script.src = src;
    script.onload = () => {
      script.onload = null;

      watch();

      function watch() {
        // @ts-expect-error -- global Monaco's require
        if (window.require) {
          resolve(script);

          return;
        }

        setTimeout(watch, 200);
      }
    };
    script.onerror = (e) => {
      reject(e);
      document.head.removeChild(script);
    };
    document.head.append(script);
  });
}

function setupEnhancedLanguages(monaco: Monaco) {
  monaco.languages.register({ id: "astro" });
  monaco.languages.registerTokensProviderFactory("astro", {
    async create() {
      const astro = await import("./monarch-syntaxes/astro");
      return astro.language;
    },
  });
  monaco.languages.setLanguageConfiguration("astro", {
    comments: {
      blockComment: ["<!--", "-->"],
    },
  });
  monaco.languages.register({ id: "svelte" });
  monaco.languages.registerTokensProviderFactory("svelte", {
    async create() {
      const svelte = await import("./monarch-syntaxes/svelte");
      return svelte.language;
    },
  });
  monaco.languages.setLanguageConfiguration("svelte", {
    comments: {
      blockComment: ["<!--", "-->"],
    },
  });
  monaco.languages.register({ id: "toml" });
  monaco.languages.registerTokensProviderFactory("toml", {
    async create() {
      const toml = await import("./monarch-syntaxes/toml");
      return toml.language;
    },
  });
  monaco.languages.setLanguageConfiguration("toml", {
    comments: {
      lineComment: "#",
    },
    brackets: [
      ["{", "}"],
      ["[", "]"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
    ],
  });
}
