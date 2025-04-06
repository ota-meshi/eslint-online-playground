import type * as monaco from "monaco-editor";
export type Monaco = typeof monaco;
import { version as monacoVersion } from "monaco-editor/package.json";
import type { HighlighterCore, LanguageRegistration } from "shiki";
import { createHighlighterCore } from "shiki/bundle/web";
import { shikiToMonaco } from "@shikijs/monaco";
import type { Language } from "../components/lang";
import { ALL_LANGUAGES } from "../components/lang";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

let monacoPromise: Promise<Monaco> | null = null;

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
  const highlighter = await createHighlighterCore({
    themes: [
      import(`@shikijs/themes/github-dark`),
      import(`@shikijs/themes/github-light`),
    ],
    langs: [import("./syntaxes/ejs.tmlanguage").then((m) => m.grammar)],
    // `shiki/wasm` contains the wasm binary inlined as base64 string.
    engine: createOnigurumaEngine(import("shiki/wasm")),
  });
  // Register the themes from Shiki, and provide syntax highlighting for Monaco.
  shikiToMonaco(highlighter, monaco);
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
    const module = (await import(
      // @ts-expect-error -- ignore
      /* @vite-ignore */ "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/astro"
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
    )) as typeof import("@ota-meshi/site-kit-monarch-syntaxes/astro");

    return module.loadAstroLanguageConfig();
  });
  registerLanguageConfiguration(monaco, "stylus", async () => {
    const module = (await import(
      // @ts-expect-error -- ignore
      /* @vite-ignore */ "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/stylus"
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
    )) as typeof import("@ota-meshi/site-kit-monarch-syntaxes/stylus");
    return module.loadStylusLanguageConfig();
  });
  registerLanguageConfiguration(monaco, "svelte", async () => {
    const module = (await import(
      // @ts-expect-error -- ignore
      /* @vite-ignore */ "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/svelte"
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
    )) as typeof import("@ota-meshi/site-kit-monarch-syntaxes/svelte");
    return module.loadSvelteLanguageConfig();
  });
  registerLanguageConfiguration(monaco, "toml", async () => {
    const module = (await import(
      // @ts-expect-error -- ignore
      /* @vite-ignore */ "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/toml"
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
    )) as typeof import("@ota-meshi/site-kit-monarch-syntaxes/toml");
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
  javascript: () => import("@shikijs/langs/javascript").then((m) => m.default),
  typescript: () => import("@shikijs/langs/typescript").then((m) => m.default),
  json: () => import("@shikijs/langs/json").then((m) => m.default),
  html: () => import("@shikijs/langs/html").then((m) => m.default),
  vue: () => import("@shikijs/langs/vue").then((m) => m.default),
  markdown: () => import("@shikijs/langs/markdown").then((m) => m.default),
  yaml: () => import("@shikijs/langs/yaml").then((m) => m.default),
  astro: () => import("@shikijs/langs/astro").then((m) => m.default),
  svelte: () => import("@shikijs/langs/svelte").then((m) => m.default),
  css: () => import("@shikijs/langs/css").then((m) => m.default),
  scss: () => import("@shikijs/langs/scss").then((m) => m.default),
  stylus: () => import("@shikijs/langs/stylus").then((m) => m.default),
  less: () => import("@shikijs/langs/less").then((m) => m.default),
  toml: () => import("@shikijs/langs/toml").then((m) => m.default),
  cds: () => import("./syntaxes/cds.tmLanguage").then((m) => m.grammar),
};

const needRegisterShikiHighlighterLanguageIds = new Set<Language>();
let registerShikiHighlighterLanguageTimeoutId: NodeJS.Timeout | null = null;

function registerShikiHighlighter(
  monaco: Monaco,
  highlighter: HighlighterCore,
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
  highlighter: HighlighterCore,
  languageId: Language,
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
    shikiToMonaco(highlighter, monaco);
    for (const [editor, theme] of editorThemes) {
      editor.updateOptions({ theme } as any);
    }
  }, 200);
}
