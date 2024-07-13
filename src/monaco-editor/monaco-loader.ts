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
    setAllValidations(monaco, true, {
      json:
        jsonAs === "jsonc"
          ? { allowComments: true, trailingCommas: "ignore" }
          : { allowComments: false, trailingCommas: "error" },
    });
  });
}

export function disableBuiltinValidate(): void {
  validateStateQueue = validateStateQueue.then(async () => {
    const monaco = await loadMonaco();
    setAllValidations(monaco, false);
  });
}

function setAllValidations(
  monaco: Monaco,
  validate: boolean,
  languageOptions?: {
    json?: monaco.languages.json.DiagnosticsOptions;
  },
) {
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    ...monaco.languages.typescript.javascriptDefaults.getDiagnosticsOptions(),
    noSemanticValidation: !validate,
    noSyntaxValidation: !validate,
  });
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    ...monaco.languages.typescript.typescriptDefaults.getDiagnosticsOptions(),
    noSemanticValidation: !validate,
    noSyntaxValidation: !validate,
  });
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    ...monaco.languages.json.jsonDefaults.diagnosticsOptions,
    validate,
    ...languageOptions?.json,
  });
  monaco.languages.css.cssDefaults.setOptions({
    ...monaco.languages.css.cssDefaults.options,
    validate,
  });
  monaco.languages.css.scssDefaults.setOptions({
    ...monaco.languages.css.scssDefaults.options,
    validate,
  });
  monaco.languages.css.lessDefaults.setOptions({
    ...monaco.languages.css.lessDefaults.options,
    validate,
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
  const dynamicImport: <M>(file: string) => Promise<M> = new Function(
    "file",
    "return import(file)",
  ) as any;
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
  dynamicImport<typeof import("@ota-meshi/site-kit-monarch-syntaxes/astro")>(
    "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/astro",
  ).then((module) => module.setupAstroLanguage(monaco));
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
  dynamicImport<typeof import("@ota-meshi/site-kit-monarch-syntaxes/stylus")>(
    "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/stylus",
  ).then((module) => module.setupStylusLanguage(monaco));
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
  dynamicImport<typeof import("@ota-meshi/site-kit-monarch-syntaxes/svelte")>(
    "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/svelte",
  ).then((module) => module.setupSvelteLanguage(monaco));
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
  dynamicImport<typeof import("@ota-meshi/site-kit-monarch-syntaxes/toml")>(
    "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/toml",
  ).then((module) => module.setupTomlLanguage(monaco));
}
