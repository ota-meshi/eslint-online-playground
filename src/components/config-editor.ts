import defaultConfig from "./defaults/config.json";
import type { MonacoEditor } from "../monaco-editor/monaco-setup.js";
import { setupMonacoEditor } from "../monaco-editor/monaco-setup.js";

export type ConfigEditorOptions = {
  /** Specify a target element to set up the config editor. */
  element: HTMLElement;
  /** Specify the initial values. */
  init: {
    /** Config text. */
    value?: string;
  };
  /** Event listeners. */
  listeners: {
    /** Notifies that the config value have changed. */
    onChangeValue: (value: string) => void;
  };
};
export type ConfigEditor = MonacoEditor;

/**
 * Setup a config editor component.
 * This component has a config format select and a config editor.
 */
export async function setupConfigEditor({
  element,
  listeners,
  init,
}: ConfigEditorOptions): Promise<ConfigEditor> {
  const monacoEditor = await setupMonacoEditor({
    element: element.querySelector<HTMLDivElement>(".ep-config-monaco")!,
    init: {
      language: "json",
      value: init?.value ?? JSON.stringify(defaultConfig, null, 2),
    },
    listeners,
    useDiffEditor: false,
  });

  return {
    ...monacoEditor,
  };
}
