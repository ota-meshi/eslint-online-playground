import type * as monaco from "monaco-editor";
export type Monaco = typeof monaco;
import { version as monacoVersion } from "monaco-editor/package.json";
import type { HighlighterCore, LanguageRegistration } from "shiki";
import type { Language } from "../components/lang";
import { ALL_LANGUAGES } from "../components/lang";

// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair -- ok
/* eslint-disable @typescript-eslint/consistent-type-imports  -- OK */

type ShikiHighlighterContext = {
  shikiMonaco: typeof import("@shikijs/monaco");
};
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
      const monaco: Monaco = await loadModuleFromMonaco(
        "vs/editor/editor.main",
      );

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
  const createHighlighterCore = shikiWeb.createHighlighterCore;
  const createOnigurumaEngine = oniguruma.createOnigurumaEngine;
  const shikiToMonaco = shikiMonaco.shikiToMonaco;
  const highlighter = await createHighlighterCore({
    themes: [
      importFromEsmSh<typeof import("@shikijs/themes/github-dark")>(
        "@shikijs/themes/github-dark",
      ),
      importFromEsmSh<typeof import("@shikijs/themes/github-light")>(
        "@shikijs/themes/github-light",
      ),
    ],
    langs: [import("./syntaxes/ejs.tmlanguage").then((m) => m.grammar)],
    engine: createOnigurumaEngine(importFromEsmSh("shiki/wasm")),
  });
  // Register the themes from Shiki, and provide syntax highlighting for Monaco.
  shikiToMonaco(highlighter, monaco);
  for (const id of ALL_LANGUAGES) {
    if (!monacoLanguageIds.has(id)) {
      monaco.languages.register({ id });
    }
    registerShikiHighlighter(monaco, highlighter, id, { shikiMonaco });
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

const TEXTMATE_LANGUAGES: Record<
  Language,
  () => Promise<LanguageRegistration | LanguageRegistration[]>
> = {
  javascript: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/javascript",
    ).then((m) => m.default),
  typescript: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/typescript",
    ).then((m) => m.default),
  json: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/json",
    ).then((m) => m.default),
  html: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/html",
    ).then((m) => m.default),
  vue: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/vue",
    ).then((m) => m.default),
  markdown: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/markdown",
    ).then((m) => m.default),
  yaml: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/yaml",
    ).then((m) => m.default),
  astro: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/astro",
    ).then((m) => m.default),
  svelte: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/svelte",
    ).then((m) => m.default),
  css: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/css",
    ).then((m) => m.default),
  scss: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/scss",
    ).then((m) => m.default),
  stylus: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/stylus",
    ).then((m) => m.default),
  less: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/less",
    ).then((m) => m.default),
  toml: () =>
    importFromEsmSh<{ default: LanguageRegistration[] }>(
      "@shikijs/langs/toml",
    ).then((m) => m.default),
  cds: () => import("./syntaxes/cds.tmLanguage").then((m) => m.grammar),
};

const needRegisterShikiHighlighterLanguageIds = new Set<Language>();
let registerShikiHighlighterLanguageTimeoutId: NodeJS.Timeout | null = null;

function registerShikiHighlighter(
  monaco: Monaco,
  highlighter: HighlighterCore,
  languageId: Language,
  context: ShikiHighlighterContext,
): void {
  const models = monaco.editor
    .getModels()
    .filter((model) => model.getLanguageId() === languageId);

  if (!models.length) {
    monaco.languages.onLanguageEncountered(languageId, () => {
      registerShikiHighlighterLanguage(
        monaco,
        highlighter,
        languageId,
        context,
      );
    });
  } else {
    registerShikiHighlighterLanguage(monaco, highlighter, languageId, context);
  }
}

function registerShikiHighlighterLanguage(
  monaco: Monaco,
  highlighter: HighlighterCore,
  languageId: Language,
  context: ShikiHighlighterContext,
) {
  needRegisterShikiHighlighterLanguageIds.add(languageId);
  if (registerShikiHighlighterLanguageTimeoutId != null)
    clearTimeout(registerShikiHighlighterLanguageTimeoutId);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- OK
  registerShikiHighlighterLanguageTimeoutId = setTimeout(async () => {
    const languageRegistrations = [
      ...needRegisterShikiHighlighterLanguageIds,
    ].map((languageId) => TEXTMATE_LANGUAGES[languageId]());
    needRegisterShikiHighlighterLanguageIds.clear();
    await highlighter.loadLanguage(
      ...(await Promise.all(languageRegistrations)).flat(),
    );
    const editorThemes = monaco.editor.getEditors().map((editor) => {
      return [editor, (editor.getRawOptions() as any).theme] as const;
    });
    // Register the themes from Shiki, and provide syntax highlighting for Monaco.
    context.shikiMonaco.shikiToMonaco(highlighter, monaco);
    for (const [editor, theme] of editorThemes) {
      editor.updateOptions({ theme } as any);
    }
  }, 200);
}
