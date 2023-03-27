import "./demo.css";
import type { LinterServiceResultSuccess } from "./linter-service";
import type { PackageJsonData } from "./components/deps-editor";
import type { Linter } from "eslint";
import { debounce } from "./utils/debounce";
import type { editor } from "monaco-editor";
import html from "./demo.html?raw";
import { loadMonaco } from "./monaco-editor";
import { setupCodeEditor } from "./components/code-editor";
import { setupConfigEditor } from "./components/config-editor";
import { setupConsoleOutput } from "./components/console";
import { setupDepsEditor } from "./components/deps-editor";
import { setupLintServer } from "./linter-service";
import { setupTabs } from "./components/output-tabs";
import { setupWarningsPanel } from "./components/warnings";

export type InputValues = {
  /** Code text to lint. */
  code: string;
  /** The file name of the code. */
  fileName: string;
  /** Config text. */
  config: string;
  /** Dependency packages text. */
  deps: string;
};

export type MountOptions = {
  /** Specify a target element to mount the ESLint demo. */
  element: HTMLElement;
  /** Specify the initial values used for the demo. */
  init?: Partial<InputValues>;
  /** Event listeners. */
  listeners?: {
    /** Notifies that the input values have changed. */
    onChange?: (values: InputValues) => void;
  };
};

/**
 * Mount the ESLint demo.
 */
export async function mount({
  element,
  init,
  listeners,
}: MountOptions): Promise<{ dispose: () => void }> {
  element.innerHTML = html;

  const inputTabs = setupTabs({
    element: element.querySelector<HTMLDivElement>(".ep-input-tabs")!,
  });
  const outputTabs = setupTabs({
    element: element.querySelector<HTMLDivElement>(".ep-output-tabs")!,
  });
  const consoleOutput = setupConsoleOutput({
    element: element.querySelector<HTMLDivElement>(".ep-console")!,
  });

  consoleOutput.clear();
  consoleOutput.appendLine("Setup...");

  const warningsPanel = setupWarningsPanel({
    element: element.querySelector<HTMLDivElement>(".ep-warnings")!,
    listeners: {
      onClickMessage(message) {
        const editor = codeEditor.getLeftEditor();

        // Focus on the warning part.
        editor.setSelection({
          startLineNumber: message.line,
          startColumn: message.column,
          endLineNumber: message.endLine ?? message.line,
          endColumn: message.endColumn ?? message.column,
        });
        editor.revealLineInCenter(message.line);

        inputTabs.setChecked("code");
      },
    },
  });
  const [codeEditor, configEditor, depsEditor, lintServer, monaco] =
    await Promise.all([
      setupCodeEditor({
        element: element.querySelector<HTMLDivElement>(".ep-code")!,
        listeners: {
          onChangeValue: debounce((value) => {
            onChangeValues({
              code: value,
            });
          }),
          onChangeFileName: debounce((fileName) => {
            onChangeValues({
              fileName,
            });
          }),
        },
        init: { value: init?.code, fileName: init?.fileName },
      }),
      setupConfigEditor({
        element: element.querySelector<HTMLDivElement>(".ep-config")!,
        listeners: {
          onChangeValue: debounce((value) => {
            onChangeValues({
              config: value,
            });
          }),
        },
        init: { value: init?.config },
      }),
      setupDepsEditor({
        element: element.querySelector<HTMLDivElement>(".ep-deps")!,
        listeners: {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises -- ignore
          onChangeValue: debounce(async (value): Promise<void> => {
            if (!(await updatePackageJson(value))) {
              return;
            }

            listeners?.onChange?.({
              code: codeEditor.getLeftValue(),
              fileName: codeEditor.getFileName(),
              config: configEditor.getValue(),
              deps: value,
            });

            consoleOutput.clear();
            await lintServer.install();
            await updateInstalledPackages();
            await lintServer.restart();
            void lint({
              code: codeEditor.getLeftValue(),
              fileName: codeEditor.getFileName(),
              config: configEditor.getValue(),
            });
          }),
        },
        init: { value: init?.deps },
      }),
      setupLintServer({ consoleOutput, outputTabs }),
      loadMonaco(),
    ]);

  let seq = 0;

  if (await updatePackageJson(depsEditor.getValue())) {
    await lintServer.install();
    await updateInstalledPackages();
    void lint({
      code: codeEditor.getLeftValue(),
      fileName: codeEditor.getFileName(),
      config: configEditor.getValue(),
    });
  }

  return {
    async dispose() {
      codeEditor.disposeEditor();
      configEditor.disposeEditor();
      depsEditor.disposeEditor();
      await lintServer.teardown();
      element.innerHTML = "";
    },
  };

  async function updatePackageJson(deps: string) {
    try {
      await lintServer.updatePackageJson(JSON.parse(deps));

      return true;
    } catch (e) {
      outputTabs.setChecked("console");
      consoleOutput.clear();
      consoleOutput.appendLine((e as Error).message);

      return false;
    }
  }

  /** Read the actual installed packages and display version information. */
  async function updateInstalledPackages() {
    const packageJsonText = depsEditor.getValue();

    let pkg: {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    } = {};

    try {
      pkg = JSON.parse(packageJsonText);
    } catch (e) {
      // eslint-disable-next-line no-console -- Demo runtime
      console.warn(e);
    }
    const depsPackageNames = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];

    const packages: PackageJsonData[] = [];

    for (const packageName of depsPackageNames) {
      try {
        const json = await lintServer.readFile(
          `/node_modules/${packageName}/package.json`
        );
        const packageJson = JSON.parse(json);

        packages.push(packageJson);
      } catch (e) {
        // eslint-disable-next-line no-console -- Demo runtime
        console.warn(e);
      }
    }

    depsEditor.setPackages(packages);
  }

  /** Handle input values change events. */
  function onChangeValues({
    code = codeEditor.getLeftValue(),
    fileName = codeEditor.getFileName(),
    config = configEditor.getValue(),
  }: {
    code?: string;
    fileName?: string;
    config?: string;
  }) {
    listeners?.onChange?.({
      code,
      fileName,
      config,
      deps: depsEditor.getValue(),
    });
    void lint({
      code,
      fileName,
      config,
    });
  }

  /** Run the linting and display the results in the results panel and as markers in the editor. */
  async function lint({
    code,
    fileName,
    config,
  }: {
    code: string;
    fileName: string;
    config: string;
  }) {
    const version = seq++;

    codeEditor.setRightValue(code);
    codeEditor.setLeftMarkers([]);
    codeEditor.setRightMarkers([]);
    const result = await lintServer.lint({
      version,
      code,
      fileName,
      config,
    });

    if (result.version > version) {
      // Overtaken by the next linting
      return;
    }

    warningsPanel.setResult(result);
    outputTabs.setChecked("warnings");

    if (result.returnCode !== 0) {
      return;
    }

    codeEditor.setLeftMarkers(
      result.result.messages.map((m) => messageToMarker(m, result.ruleMetadata))
    );
    codeEditor.setRightMarkers(
      result.fixResult.messages.map((m) =>
        messageToMarker(m, result.ruleMetadata)
      )
    );
    codeEditor.setRightValue(result.output || "");
  }

  function messageToMarker(
    message: Linter.LintMessage,
    ruleMetadata: LinterServiceResultSuccess["ruleMetadata"]
  ): editor.IMarkerData {
    const startLineNumber = message.line;
    const startColumn = message.column;
    const endLineNumber = message.endLine ?? startLineNumber;
    const endColumn = message.endColumn ?? startColumn;
    const meta = message.ruleId ? ruleMetadata[message.ruleId] : null;
    const docUrl = meta?.docs?.url;
    const code = docUrl
      ? {
          value: message.ruleId!,
          target:
            // Maybe monaco type bug
            docUrl as any,
        }
      : message.ruleId || "FATAL";

    return {
      code,
      severity:
        message.severity === 1
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Error,
      source: "ESLint",
      message: message.message,
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
    };
  }
}
