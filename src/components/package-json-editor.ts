import defaultPackageJson from "./defaults/package.json.js";
import type { MonacoEditor } from "../monaco-editor/monaco-setup.js";
import { setupMonacoEditor } from "../monaco-editor/monaco-setup.js";

export type PackageJsonEditorOptions = {
  /** Specify a target element to set up the package.json editor. */
  element: HTMLElement;
  /** Specify the initial values. */
  init: {
    /** package.json text. */
    value?: string;
  };
  /** Event listeners. */
  listeners: {
    /** Notifies that the package.json text have changed. */
    onChangeValue: (value: string) => void;
  };
};
export type PackageJsonEditor = MonacoEditor & {
  setPackages: (packages: PackageJsonData[]) => void;
};
export type PackageJsonData = {
  name: string;
  version: string;
  homepage?: string;
};
/** Setup a package.json editor component. */
export async function setupPackageJsonEditor({
  element,
  listeners,
  init,
}: PackageJsonEditorOptions): Promise<PackageJsonEditor> {
  const versionsPanel = element.querySelector<HTMLUListElement>(
    ".ep-package-json-versions"
  )!;

  const monacoEditor = await setupMonacoEditor({
    element: element.querySelector(".ep-package-json-monaco")!,
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

        li.classList.add("ep-package-json-item");

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
