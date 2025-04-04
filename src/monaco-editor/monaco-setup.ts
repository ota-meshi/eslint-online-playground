import type { CancellationToken, Range, IDisposable } from "monaco-editor";
import { editor } from "monaco-editor";
import { languages } from "monaco-editor";
import { loadMonaco } from "./monaco-loader.js";

export const DARK_THEME_NAME = "github-dark";
export const LIGHT_THEME_NAME = "github-light";

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
  /** Sets a code action provider. */
  setCodeActionProvider: (codeActionProvider: CodeActionProvider) => void;
  /** Gets a quick fix from the marker */
  getQuickFixesFromMarker: (
    marker: editor.IMarkerData,
  ) => Promise<languages.CodeActionList>;
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
  /** Sets a code action provider. */
  setCodeActionProvider: (codeActionProvider: CodeActionProvider) => void;
  /** Gets a quick fix from the marker */
  getQuickFixesFromMarker: (
    marker: editor.IMarkerData,
  ) => Promise<languages.CodeActionList>;
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
    theme: init.theme === "dark" ? DARK_THEME_NAME : LIGHT_THEME_NAME,
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
      useInlineViewWhenSpaceIsLimited: false,
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
      setCodeActionProvider: (provideCodeActions) =>
        codeActionProvider.set(provideCodeActions),
      getQuickFixesFromMarker: (marker) =>
        codeActionProvider.getQuickFixesFromMarker(marker),
      setTheme: (theme: "dark" | "light") => {
        leftEditor.updateOptions({
          theme: theme === "dark" ? DARK_THEME_NAME : LIGHT_THEME_NAME,
        });
        rightEditor.updateOptions({
          theme: theme === "dark" ? DARK_THEME_NAME : LIGHT_THEME_NAME,
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
    setCodeActionProvider: (provideCodeActions) =>
      codeActionProvider.set(provideCodeActions),
    getQuickFixesFromMarker: (marker) =>
      codeActionProvider.getQuickFixesFromMarker(marker),
    setTheme: (theme: "dark" | "light") => {
      standaloneEditor.updateOptions({
        theme: theme === "dark" ? DARK_THEME_NAME : LIGHT_THEME_NAME,
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
  function updateValue(
    editorInstance: editor.IStandaloneCodeEditor,
    value: string,
  ) {
    const old = editorInstance.getValue();

    if (old !== value) {
      if (editorInstance.getOption(editor.EditorOption.readOnly)) {
        editorInstance.setValue(value);
      } else {
        const model = editorInstance.getModel()!;
        editorInstance.executeEdits("update-value", [
          {
            range: model.getFullModelRange(),
            text: value,
            forceMoveMarkers: true,
          },
        ]);
      }
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
    set: (codeActionProvider: CodeActionProvider) => void;
    getQuickFixesFromMarker: (
      marker: editor.IMarkerData,
    ) => Promise<languages.CodeActionList>;
    dispose: () => void;
  } {
    let codeActionProviderDisposable: IDisposable = {
      dispose: () => {
        // void
      },
    };

    let getQuickFixesFromMarker:
      | ((marker: editor.IMarkerData) => ReturnType<CodeActionProvider>)
      | null = null;

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

      getQuickFixesFromMarker = async (marker) => {
        const model = editor.getModel()!;

        const range = new monaco.Range(
          marker.startLineNumber,
          marker.startColumn,
          marker.endLineNumber,
          marker.endColumn,
        );

        const context: languages.CodeActionContext = {
          markers: [marker],
          trigger: languages.CodeActionTriggerType.Invoke,
          only: "quickfix",
        };

        const token: CancellationToken = {
          isCancellationRequested: false,
          onCancellationRequested: () => {
            return {
              dispose() {
                // noop
              },
            };
          },
        };

        const result = await codeActionProvider(model, range, context, token);

        return result;
      };
    }

    return {
      set: (codeActionProvider) => {
        updateCodeActionProvider(codeActionProvider);
      },
      getQuickFixesFromMarker: async (marker) =>
        (await getQuickFixesFromMarker?.(marker)) || {
          actions: [],
          dispose() {
            // noop
          },
        },
      dispose() {
        codeActionProviderDisposable.dispose();
      },
    };
  }
}
