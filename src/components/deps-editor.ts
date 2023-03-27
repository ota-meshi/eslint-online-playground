import defaultPackageJson from "./defaults/package.json.js";
import type { MonacoEditor } from "../monaco-editor/monaco-setup.js";
import { setupMonacoEditor } from "../monaco-editor/monaco-setup.js";

export type DepsEditorOptions = {
  /** Specify a target element to set up the dependencies editor. */
  element: HTMLElement;
  /** Specify the initial values. */
  init: {
    /** Dependency packages text. */
    value?: string;
  };
  /** Event listeners. */
  listeners: {
    /** Notifies that the dependency packages text have changed. */
    onChangeValue: (value: string) => void;
  };
};
export type DepsEditor = MonacoEditor & {
  setPackages: (packages: PackageJsonData[]) => void;
};
export type PackageJsonData = {
  name: string;
  version: string;
  homepage?: string;
};
/** Setup a dependencies editor component. */
export async function setupDepsEditor({
  element,
  listeners,
  init,
}: DepsEditorOptions): Promise<DepsEditor> {
  const versionsPanel =
    element.querySelector<HTMLUListElement>(".ep-deps-versions")!;

  const monacoEditor = await setupMonacoEditor({
    element: element.querySelector(".ep-deps-monaco")!,
    init: {
      language: "json",
      value: init?.value ?? JSON.stringify(defaultPackageJson, null, 2),
    },
    listeners,
    useDiffEditor: false,
  });

  return {
    ...monacoEditor,
    setPackages(packages: PackageJsonData[]) {
      versionsPanel.innerHTML = "";

      for (const pkg of packages) {
        const li = document.createElement("li");

        li.classList.add("ep-deps-item");

        const nameLink = document.createElement("a");

        nameLink.textContent = pkg.name;
        nameLink.href =
          pkg.homepage || `https://www.npmjs.com/package/${pkg.name}`;
        nameLink.target = "_blank";
        li.appendChild(nameLink);
        li.appendChild(document.createTextNode(`@${pkg.version}`));
        versionsPanel.appendChild(li);
      }
    },
  };
}
