import type * as monaco from "monaco-editor";
export type Monaco = typeof monaco;
import { version as monacoVersion } from "monaco-editor/package.json";
import type { HighlighterGeneric, LanguageRegistration } from "shiki";
import type { Language } from "../components/lang";
import { ALL_LANGUAGES } from "../components/lang";
import type { BundledLanguage } from "shiki/bundle/web";
import { DARK_THEME_NAME, LIGHT_THEME_NAME } from "./monaco-setup";

// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair -- ok
/* eslint-disable @typescript-eslint/consistent-type-imports  -- OK */

let monacoPromise: Promise<Monaco> | null = null;

function importFromEsmSh<T>(path: string): Promise<T> {
  return importFromCDN(`https://esm.sh/${path}`);
}

function importFromCDN<T>(path: string): Promise<T> {
  return import(/* @vite-ignore */ path);
}

/** Load the Monaco editor object. */
export function loadMonaco(): Promise<Monaco> {
  return (
    monacoPromise ||
    (monacoPromise = (async () => {
      let rawMonaco: Monaco | { m: Monaco }, monaco: Monaco;
      try {
        rawMonaco = await loadMonacoFromEsmCdn();
      } catch {
        rawMonaco = await loadModuleFromMonaco<Monaco | { m: Monaco }>(
          "vs/editor/editor.main",
        );
      }
      if ("m" in rawMonaco) {
        monaco = rawMonaco.m || rawMonaco;
      } else {
        monaco = rawMonaco;
      }

      await setupEnhancedLanguages(monaco);

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
    json?: monaco.json.DiagnosticsOptions;
  },
) {
  monaco.typescript.javascriptDefaults.setDiagnosticsOptions({
    ...monaco.typescript.javascriptDefaults.getDiagnosticsOptions(),
    noSemanticValidation: !validate,
    noSyntaxValidation: !validate,
  });
  monaco.typescript.typescriptDefaults.setDiagnosticsOptions({
    ...monaco.typescript.typescriptDefaults.getDiagnosticsOptions(),
    noSemanticValidation: !validate,
    noSyntaxValidation: !validate,
  });
  monaco.json.jsonDefaults.setDiagnosticsOptions({
    ...monaco.json.jsonDefaults.diagnosticsOptions,
    validate,
    ...languageOptions?.json,
  });
  monaco.css.cssDefaults.setOptions({
    ...monaco.css.cssDefaults.options,
    validate,
  });
  monaco.css.scssDefaults.setOptions({
    ...monaco.css.scssDefaults.options,
    validate,
  });
  monaco.css.lessDefaults.setOptions({
    ...monaco.css.lessDefaults.options,
    validate,
  });
}

/** Load the Monaco editor. */
async function loadMonacoFromEsmCdn(): Promise<Monaco> {
  let error = new Error();
  const urlList = [
    {
      script: "https://cdn.jsdelivr.net/npm/monaco-editor/+esm",
      style:
        "https://cdn.jsdelivr.net/npm/monaco-editor/min/vs/editor/editor.main.css",
    },
  ];

  if (typeof monacoVersion !== "undefined") {
    urlList.unshift({
      script: `https://cdn.jsdelivr.net/npm/monaco-editor@${monacoVersion}/+esm`,
      style: `https://cdn.jsdelivr.net/npm/monaco-editor@${monacoVersion}/min/vs/editor/editor.main.css`,
    });
  }
  for (const url of urlList) {
    try {
      const result = await importFromCDN(url.script);

      if (typeof document !== "undefined") {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url.style;
        document.head.append(link);
      }
      return result as Monaco;
    } catch (e: unknown) {
      // eslint-disable-next-line no-console -- OK
      console.warn(`Failed to retrieve resource from ${url}`);
      error = e as Error;
    }
  }
  throw error;
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

async function setupEnhancedLanguages(monaco: Monaco) {
  const monacoLanguageIds = new Set(
    monaco.languages.getLanguages().map((l) => l.id),
  );
  const [shikiWeb, shikiMonaco, oniguruma] = await Promise.all([
    importFromEsmSh<typeof import("shiki/bundle/web")>("shiki/bundle/web"),
    importFromEsmSh<typeof import("@shikijs/monaco")>("@shikijs/monaco"),
    importFromEsmSh<typeof import("shiki/engine/oniguruma")>(
      "shiki/engine/oniguruma",
    ),
  ]);
  const highlighter = await shikiWeb.createHighlighter({
    themes: [DARK_THEME_NAME, LIGHT_THEME_NAME],
    langs: [import("./syntaxes/ejs.tmlanguage").then((m) => m.grammar)],
    engine: oniguruma.createOnigurumaEngine(importFromEsmSh("shiki/wasm")),
  });
  // Register the themes from Shiki, and provide syntax highlighting for Monaco.
  shikiMonaco.shikiToMonaco(highlighter, monaco);
  for (const id of ALL_LANGUAGES) {
    if (!monacoLanguageIds.has(id)) {
      monaco.languages.register({ id });
    }
    registerShikiHighlighter(monaco, highlighter, id);
  }

  registerLanguageConfiguration(monaco, "vue", async () => {
    const module = await import("./syntaxes/vue-language-configuration");
    return module.getConfig(monaco);
  });

  registerLanguageConfiguration(monaco, "astro", async () => {
    const module = await importFromEsmSh<
      typeof import("@ota-meshi/site-kit-monarch-syntaxes/astro")
    >("@ota-meshi/site-kit-monarch-syntaxes/astro");

    return module.loadAstroLanguageConfig();
  });
  registerLanguageConfiguration(monaco, "stylus", async () => {
    const module = await importFromEsmSh<
      typeof import("@ota-meshi/site-kit-monarch-syntaxes/stylus")
    >("@ota-meshi/site-kit-monarch-syntaxes/stylus");
    return module.loadStylusLanguageConfig();
  });
  registerLanguageConfiguration(monaco, "svelte", async () => {
    const module = await importFromEsmSh<
      typeof import("@ota-meshi/site-kit-monarch-syntaxes/svelte")
    >("@ota-meshi/site-kit-monarch-syntaxes/svelte");
    return module.loadSvelteLanguageConfig();
  });
  registerLanguageConfiguration(monaco, "toml", async () => {
    const module = await importFromEsmSh<
      typeof import("@ota-meshi/site-kit-monarch-syntaxes/toml")
    >("@ota-meshi/site-kit-monarch-syntaxes/toml");
    return module.loadTomlLanguageConfig();
  });
}

function registerLanguageConfiguration(
  monaco: Monaco,
  languageId: string,
  loadConfig: () => Promise<monaco.languages.LanguageConfiguration>,
): void {
  const models = monaco.editor
    .getModels()
    .filter((model) => model.getLanguageId() === languageId);
  if (!models.length) {
    monaco.languages.onLanguageEncountered(languageId, () => {
      void Promise.resolve(loadConfig()).then((conf) => {
        monaco.languages.setLanguageConfiguration(languageId, conf);
      });
    });
  } else {
    void Promise.resolve(loadConfig()).then((config) => {
      monaco.languages.setLanguageConfiguration(languageId, config);
    });
  }
}

const CUSTOM_LANGUAGES: Partial<
  Record<Language, () => Promise<LanguageRegistration | LanguageRegistration[]>>
> = {
  cds: () => import("./syntaxes/cds.tmLanguage").then((m) => m.grammar),
};

const needRegisterShikiHighlighterLanguageIds = new Set<Language>();
let registerShikiHighlighterLanguageTimeoutId: NodeJS.Timeout | null = null;

function registerShikiHighlighter(
  monaco: Monaco,
  highlighter: HighlighterGeneric<BundledLanguage, never>,
  languageId: Language,
): void {
  const models = monaco.editor
    .getModels()
    .filter((model) => model.getLanguageId() === languageId);

  if (!models.length) {
    monaco.languages.onLanguageEncountered(languageId, () => {
      registerShikiHighlighterLanguage(monaco, highlighter, languageId);
    });
  } else {
    registerShikiHighlighterLanguage(monaco, highlighter, languageId);
  }
}

function registerShikiHighlighterLanguage(
  monaco: Monaco,
  highlighter: HighlighterGeneric<BundledLanguage, never>,
  languageId: Language,
) {
  needRegisterShikiHighlighterLanguageIds.add(languageId);
  if (registerShikiHighlighterLanguageTimeoutId != null)
    clearTimeout(registerShikiHighlighterLanguageTimeoutId);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- OK
  registerShikiHighlighterLanguageTimeoutId = setTimeout(async () => {
    const languageRegistrations = [
      ...needRegisterShikiHighlighterLanguageIds,
    ].map(
      (languageId) =>
        CUSTOM_LANGUAGES[languageId]?.() ??
        Promise.resolve(languageId as BundledLanguage),
    );
    needRegisterShikiHighlighterLanguageIds.clear();
    const [shikiMonaco] = await Promise.all([
      importFromEsmSh<typeof import("@shikijs/monaco")>("@shikijs/monaco"),
    ]);
    await highlighter.loadLanguage(
      ...(await Promise.all(languageRegistrations)).flat(),
    );
    const editorThemes = monaco.editor.getEditors().map((editor) => {
      return [editor, (editor.getRawOptions() as any).theme] as const;
    });
    // Register the themes from Shiki, and provide syntax highlighting for Monaco.
    shikiMonaco.shikiToMonaco(highlighter, monaco);
    for (const [editor, theme] of editorThemes) {
      editor.updateOptions({ theme } as any);
    }
  }, 200);
}
