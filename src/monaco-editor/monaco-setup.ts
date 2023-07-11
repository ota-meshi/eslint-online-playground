import type {
  editor,
  languages,
  CancellationToken,
  Range,
  IDisposable,
} from "monaco-editor";
import { loadMonaco } from "./monaco-loader.js";

export type CodeActionProvider = (
  model: editor.ITextModel,
  range: Range,
  context: languages.CodeActionContext,
  token: CancellationToken,
) => languages.ProviderResult<languages.CodeActionList>;
export type MonacoEditor = {
  type: "standalone";
  /** Set the language. */
  setModelLanguage: (language: string) => void;
  /** Sets the value text of the editor. */
  setValue: (value: string) => void;
  /** Gets the value text of the editor. */
  getValue: () => string;
  /** Set markers to the editor. */
  setMarkers: (markers: editor.IMarkerData[]) => void;
  /** Gets the editor. */
  getEditor: () => editor.IStandaloneCodeEditor;
  /** Register a code action provider. */
  registerCodeActionProvider: (codeActionProvider: CodeActionProvider) => void;
  /** Set the theme. */
  setTheme: (theme: "dark" | "light") => void;
  /** Dispose the editor. */
  disposeEditor: () => void;
};
export type MonacoDiffEditor = {
  type: "diff";
  /** Set the language. */
  setModelLanguage: (language: string) => void;
  /** Sets the value text of the original editor. */
  setLeftValue: (value: string) => void;
  /** Gets the value text of the original editor. */
  getLeftValue: () => string;
  /** Sets the value text of the modified editor. */
  setRightValue: (value: string) => void;
  /** Set markers to the original editor. */
  setLeftMarkers: (markers: editor.IMarkerData[]) => void;
  /** Set markers to the modified editor. */
  setRightMarkers: (markers: editor.IMarkerData[]) => void;
  /** Gets the original editor. */
  getLeftEditor: () => editor.IStandaloneCodeEditor;
  /** Gets the modified editor. */
  getRightEditor: () => editor.IStandaloneCodeEditor;
  /** Register a code action provider. */
  registerCodeActionProvider: (codeActionProvider: CodeActionProvider) => void;
  /** Set the theme. */
  setTheme: (theme: "dark" | "light") => void;
  /** Dispose the all editors. */
  disposeEditor: () => void;
};
export type BaseMonacoEditorOptions = {
  /** Specify a target element to set up the code editor. */
  element: HTMLElement;
  /** Specify the initial values. */
  init: {
    /** Code value. */
    value: string;
    /** Code language. */
    language: string;
    /** theme. */
    theme: "dark" | "light";
  };
  /** Event listeners. */
  listeners?: {
    /** Notifies that the code value have changed. */
    onChangeValue?: (value: string) => void;
  };
};
export type MonacoEditorOptions = BaseMonacoEditorOptions & {
  useDiffEditor: false;
};
export type MonacoDiffEditorOptions = BaseMonacoEditorOptions & {
  useDiffEditor: true;
};

/** Setup editor */
export async function setupMonacoEditor(
  options: MonacoEditorOptions,
): Promise<MonacoEditor>;
export async function setupMonacoEditor(
  options: MonacoDiffEditorOptions,
): Promise<MonacoDiffEditor>;
export async function setupMonacoEditor(
  options: BaseMonacoEditorOptions & { useDiffEditor: boolean },
): Promise<MonacoEditor | MonacoDiffEditor>;

export async function setupMonacoEditor({
  init,
  listeners,
  element,
  useDiffEditor,
}: MonacoEditorOptions | MonacoDiffEditorOptions): Promise<
  MonacoEditor | MonacoDiffEditor
> {
  element.textContent = "Loading...";
  element.style.padding = "1rem";
  element.style.fontFamily = "monospace";
  const monaco = await loadMonaco();

  element.textContent = "";
  element.style.padding = "";
  const language = init.language;

  const options: editor.IStandaloneEditorConstructionOptions = {
    value: init.value,
    theme: init.theme === "dark" ? "vs-dark" : "vs",
    language,
    automaticLayout: true,
    tabSize: 2,
    fontSize: 12,
    minimap: {
      enabled: false,
    },
    quickSuggestions: false,
    colorDecorators: false,
    renderControlCharacters: false,
    // renderIndentGuides: false,
    renderValidationDecorations: "on" as const,
    renderWhitespace: "boundary" as const,
    scrollBeyondLastLine: false,
    scrollbar: { alwaysConsumeMouseWheel: false },
  };

  if (useDiffEditor) {
    const diffEditor = monaco.editor.createDiffEditor(element, {
      originalEditable: true,
      ...options,
    });
    const original = monaco.editor.createModel(init.value, language);
    const modified = monaco.editor.createModel(init.value, language);

    const leftEditor = diffEditor.getOriginalEditor();
    const rightEditor = diffEditor.getModifiedEditor();

    rightEditor.updateOptions({ readOnly: true });
    diffEditor.setModel({ original, modified });
    original.onDidChangeContent(() => {
      const value = original.getValue();

      listeners?.onChangeValue?.(value);
    });

    const codeActionProvider = buildCodeActionProviderContainer(leftEditor);
    const result: MonacoDiffEditor = {
      type: "diff",
      setModelLanguage: (lang) => {
        for (const model of [original, modified]) {
          monaco.editor.setModelLanguage(model, lang);
        }
      },
      setLeftValue: (value) => {
        updateValue(leftEditor, value);
      },
      getLeftValue: () => original.getValue(),
      setRightValue: (value) => {
        updateValue(rightEditor, value);
      },
      setLeftMarkers: (markers) => {
        void updateMarkers(leftEditor, markers);
      },
      setRightMarkers: (markers) => {
        void updateMarkers(rightEditor, markers);
      },
      getLeftEditor: () => leftEditor,
      getRightEditor: () => rightEditor,
      registerCodeActionProvider: (provideCodeActions) =>
        codeActionProvider.register(provideCodeActions),
      setTheme: (theme: "dark" | "light") => {
        leftEditor.updateOptions({
          theme: theme === "dark" ? "vs-dark" : "vs",
        });
        rightEditor.updateOptions({
          theme: theme === "dark" ? "vs-dark" : "vs",
        });
      },
      disposeEditor: () => {
        codeActionProvider.dispose();
        leftEditor.getModel()?.dispose();
        rightEditor.getModel()?.dispose();
        leftEditor.dispose();
        rightEditor.dispose();
        diffEditor.dispose();
      },
    };

    return result;
  }

  const standaloneEditor = monaco.editor.create(element, options);

  standaloneEditor.onDidChangeModelContent(() => {
    const value = standaloneEditor.getValue();

    listeners?.onChangeValue?.(value);
  });

  const codeActionProvider = buildCodeActionProviderContainer(standaloneEditor);
  const result: MonacoEditor = {
    type: "standalone",
    setModelLanguage: (lang) => {
      const model = standaloneEditor.getModel();

      if (model) {
        monaco.editor.setModelLanguage(model, lang);
      }
    },
    setValue: (value) => {
      updateValue(standaloneEditor, value);
    },
    getValue: () => standaloneEditor.getValue(),
    setMarkers: (markers) => {
      void updateMarkers(standaloneEditor, markers);
    },
    getEditor: () => standaloneEditor,
    registerCodeActionProvider: (provideCodeActions) =>
      codeActionProvider.register(provideCodeActions),
    setTheme: (theme: "dark" | "light") => {
      standaloneEditor.updateOptions({
        theme: theme === "dark" ? "vs-dark" : "vs",
      });
    },
    disposeEditor: () => {
      codeActionProvider.dispose();
      standaloneEditor.getModel()?.dispose();
      standaloneEditor.dispose();
    },
  };

  return result;

  /** Update value */
  function updateValue(editor: editor.IStandaloneCodeEditor, value: string) {
    const old = editor.getValue();

    if (old !== value) {
      editor.setValue(value);
    }
  }

  /** Update markers */
  function updateMarkers(
    editor: editor.IStandaloneCodeEditor,
    markers: editor.IMarkerData[],
  ) {
    const model = editor.getModel()!;
    const id = editor.getId();

    monaco.editor.setModelMarkers(
      model,
      id,
      JSON.parse(JSON.stringify(markers)) as editor.IMarkerData[],
    );
  }

  function buildCodeActionProviderContainer(
    editor: editor.IStandaloneCodeEditor,
  ): {
    register: (codeActionProvider: CodeActionProvider) => void;
    dispose: () => void;
  } {
    let codeActionProviderDisposable: IDisposable = {
      dispose: () => {
        // void
      },
    };

    function updateCodeActionProvider(codeActionProvider: CodeActionProvider) {
      codeActionProviderDisposable.dispose();
      codeActionProviderDisposable =
        monaco.languages.registerCodeActionProvider("*", {
          provideCodeActions(model, ...args) {
            if (editor.getModel()!.uri !== model.uri) {
              return {
                actions: [],
                dispose() {
                  /* nop */
                },
              };
            }
            return codeActionProvider(model, ...args);
          },
        });
    }

    return {
      register: (codeActionProvider) => {
        updateCodeActionProvider(codeActionProvider);
      },
      dispose() {
        codeActionProviderDisposable.dispose();
      },
    };
  }
}
