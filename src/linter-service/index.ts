import type { ESLint } from "eslint";
import type { ConsoleOutput } from "../components/console";
import type { FileSystemTree } from "@webcontainer/api";
import { Installer } from "./installer";
import { Server } from "./server";
import type { Tabs } from "../components/output-tabs";
import { WebContainer } from "@webcontainer/api";

export type LinterServiceResult =
  | LinterServiceResultSuccess
  | LinterServiceResultError;
export type LinterServiceResultSuccess = {
  version: number;
  returnCode: 0;
  result: ESLint.LintResult;
  fixResult: ESLint.LintResult;
  output: string;
  ruleMetadata: ESLint.LintResultData["rulesMeta"];
};
export type LinterServiceResultError = {
  version: number;
  returnCode: 1;
  result: string;
};
export type LintInput = {
  /** Input version. Check if it matches the version returned. */
  version: number;
  code: string;
  fileName: string;
  config: string;
};

export interface LinterService {
  /**
   * Run linting.
   * However, if called consecutively, it returns the result of the last call.
   * Check the `version` and qualitatively check if it is the desired result.
   */
  lint: (input: LintInput) => Promise<LinterServiceResult>;
  /** Update dependency packages. */
  updatePackageJson: (pkg: any) => Promise<void>;
  /** Install dependencies. */
  install: () => Promise<void>;
  /** Restart the server. */
  restart: () => Promise<void>;
  /** Read a file in the server. */
  readFile: (path: string) => Promise<string>;

  teardown: () => Promise<void>;
}

/** Setup a linter service. */
export async function setupLintServer({
  consoleOutput,
  outputTabs,
}: {
  consoleOutput: ConsoleOutput;
  outputTabs: Tabs;
}): Promise<LinterService> {
  outputTabs.setChecked("console");
  consoleOutput.appendLine("Starting WebContainer...");

  const webContainer = await WebContainer.boot();
  const serverFiles: FileSystemTree = {};

  for (const [file, contents] of Object.entries(
    import.meta.glob("./server/**/*.mjs", { as: "raw" })
  ).map(([file, load]) => {
    return [file.slice(9), load()] as const;
  })) {
    serverFiles[file] = {
      file: {
        contents: await contents,
      },
    };
  }

  await webContainer.mount(serverFiles);

  let updatingDependencies = Promise.resolve();
  const installer = new Installer({ webContainer, consoleOutput, outputTabs });

  async function installDeps() {
    await updatingDependencies;

    const exitCode = await installer.install();

    if (exitCode !== 0) {
      throw new Error("Installation failed");
    }
  }

  const server = new Server({ webContainer, consoleOutput, outputTabs });

  let processing: Promise<void> | null = null;
  let next: (() => Promise<LinterServiceResult>) | null = null;
  let last: Promise<LinterServiceResult> | null = null;

  async function setLintProcess(
    run: () => Promise<LinterServiceResult>
  ): Promise<LinterServiceResult> {
    if (processing) {
      next = run;
      // eslint-disable-next-line @typescript-eslint/no-misused-promises, no-unmodified-loop-condition -- OK
      while (processing) {
        await processing;
      }

      return last!;
    }

    const promise = run();

    processing = promise.then(async () => {
      processing = null;

      if (next) {
        await setLintProcess(next);
        // eslint-disable-next-line require-atomic-updates -- OK
        next = null;
      }
    });
    last = promise;

    return promise;
  }

  return {
    async lint(input: LintInput) {
      const exitCode = await installer.getExitCode();

      if (exitCode !== 0) {
        throw new Error("Installation failed");
      }

      // Returns the result of the last linting process.
      return setLintProcess(() => lint(server, input));
    },
    async updatePackageJson(pkg) {
      updatingDependencies = webContainer.fs.writeFile(
        "/package.json",
        JSON.stringify(pkg, null, 2)
      );
      await updatingDependencies;
    },
    async install() {
      await installDeps();
    },
    async restart() {
      await server.restart();
    },
    readFile: async (path): Promise<string> => {
      return Promise.resolve(webContainer.fs.readFile(path, "utf8"));
    },

    teardown(): Promise<void> {
      webContainer.teardown();
      return Promise.resolve();
    },
  };
}

async function lint(server: Server, input: LintInput) {
  const content = await server.request(
    input,
    (content) => content.version >= input.version
  );

  return content;
}
