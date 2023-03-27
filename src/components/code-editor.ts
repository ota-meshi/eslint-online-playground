import defaultJs from "./defaults/default.js.txt?raw";
import type { MonacoDiffEditor } from "../monaco-editor/monaco-setup.js";
import { setupMonacoEditor } from "../monaco-editor/monaco-setup.js";

export type CodeEditorOptions = {
  /** Specify a target element to set up the code editor. */
  element: HTMLElement;
  /** Specify the initial values. */
  init: {
    /** Code text to lint. */
    value?: string;
    /** The file name of the code. */
    fileName?: string;
  };
  /** Event listeners. */
  listeners: {
    /** Notifies that the code value have changed. */
    onChangeValue: (value: string) => void;
    /** Notifies that the code file name have changed. */
    onChangeFileName: (value: string) => void;
  };
};
export type CodeEditor = MonacoDiffEditor & {
  getFileName: () => string;
};
/**
 * Setup a code editor component.
 * This component has a filename input and a code editor.
 */
export async function setupCodeEditor({
  element,
  listeners,
  init,
}: CodeEditorOptions): Promise<CodeEditor> {
  const fileNameInput =
    element.querySelector<HTMLInputElement>(".ep-code-file-name")!;
  const initFileName = adjustFileName(init.fileName);
  const monacoEditor = await setupMonacoEditor({
    element: element.querySelector<HTMLDivElement>(".ep-code-monaco")!,
    init: {
      language: getLanguage(initFileName),
      value: init.value ?? defaultJs,
    },
    listeners: {
      onChangeValue: listeners.onChangeValue,
    },
    useDiffEditor: true,
  });

  fileNameInput.value = initFileName;
  fileNameInput.addEventListener("input", () => {
    const fileName = adjustFileName(fileNameInput.value);

    if (fileNameInput.value && fileNameInput.value !== fileName) {
      fileNameInput.value = fileName;
    }

    monacoEditor.setModelLanguage(getLanguage(fileName));
    listeners.onChangeFileName(fileName);
  });

  return {
    ...monacoEditor,
    getFileName() {
      return adjustFileName(fileNameInput.value);
    },
  };

  function adjustFileName(fileName: string | undefined) {
    return fileName?.trim() || "example.js";
  }

  function getLanguage(fileName: string) {
    const lower = fileName.toLowerCase();

    return lower.endsWith(".html") || lower.endsWith(".vue")
      ? "html"
      : lower.endsWith(".js") ||
        lower.endsWith(".mjs") ||
        lower.endsWith(".cjs") ||
        lower.endsWith(".jsx")
      ? "javascript"
      : lower.endsWith(".ts") ||
        lower.endsWith(".mts") ||
        lower.endsWith(".cts") ||
        lower.endsWith(".tsx")
      ? "typescript"
      : lower.endsWith(".svelte")
      ? "svelte"
      : lower.endsWith(".astro")
      ? "astro"
      : "javascript";
  }
}
