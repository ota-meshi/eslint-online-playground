import type { WebContainer, WebContainerProcess } from "@webcontainer/api";
import { createJsonPayload, extractJson } from "./server/extract-json.mjs";
import type { ConsoleOutput } from "../components/console";
import type { Tabs } from "../components/output-tabs";

export class Server {
  private readonly webContainer: WebContainer;

  private readonly consoleOutput: ConsoleOutput;

  private readonly outputTabs: Tabs;

  private waitPromise: Promise<any>;

  private server: ServerInternal | undefined;

  public constructor({
    consoleOutput,
    outputTabs,
    webContainer,
  }: {
    webContainer: WebContainer;
    consoleOutput: ConsoleOutput;
    outputTabs: Tabs;
  }) {
    this.webContainer = webContainer;
    this.consoleOutput = consoleOutput;
    this.outputTabs = outputTabs;

    this.waitPromise = Promise.resolve(undefined as any);
  }

  /**
   * Request to the server.
   * Start the server if it is not already started or if the server was stopped.
   */
  public request(data: any, test: (res: any) => boolean): Promise<any> {
    const result = this.waitPromise.then(async () => {
      let server = this.server;

      if (!server) {
        this.outputTabs.setChecked("console");
        this.consoleOutput.appendLine("Starting server...");
        server = await this._serverStart();
      }

      await server.ready;

      if (server.isExit) {
        await this.restart();
        await server.ready;
      }

      if (server.isExit) {
        throw new Error("Server could not be started.");
      }

      return server.request(data, test);
    });

    this.waitPromise = result.catch(() => undefined);

    return result;
  }

  /** Restart the server. */
  public restart(): Promise<void> {
    const result = this.waitPromise.then(async () => {
      if (this.server) {
        this.server.process.kill();
        await this.server.process.exit;
        this.outputTabs.setChecked("console");
        this.consoleOutput.appendLine("Restarting server...");
      } else {
        this.outputTabs.setChecked("console");
        this.consoleOutput.appendLine("Starting server...");
      }

      await this._serverStart();
    });

    this.waitPromise = result.catch(() => undefined);

    return result;
  }

  private async _serverStart() {
    this.server = await startServerInternal(this.webContainer);
    void this.server.ready.then(() => {
      this.consoleOutput.appendLine("Server started");
    });

    return this.server;
  }
}

type ServerInternal = {
  process: WebContainerProcess;
  request: (data: any, test: (data: any) => boolean) => Promise<string>;
  ready: Promise<void>;
  isExit: boolean;
};

async function startServerInternal(
  webContainer: WebContainer
): Promise<ServerInternal> {
  const serverProcess = await webContainer.spawn("node", ["./server.mjs"]);

  let boot = false;
  const callbacks: ((json: string) => void)[] = [];

  void serverProcess.output.pipeTo(
    new WritableStream({
      write(str) {
        if (!callbacks.length) {
          // eslint-disable-next-line no-console -- Demo runtime
          if (!boot) console.log(str);

          return;
        }

        const output = extractJson(str);

        if (!output) {
          // eslint-disable-next-line no-console -- Demo runtime
          if (!boot) console.log(str);

          return;
        }

        callbacks.forEach((f) => f(output));
      },
    })
  );

  const writer = serverProcess.input.getWriter();

  async function request(
    data: any,
    test: (data: any) => boolean
  ): Promise<string> {
    await writer.write(createJsonPayload(data));

    return new Promise((resolve) => {
      function callback(output: string) {
        if (test(output)) {
          const i = callbacks.indexOf(callback);

          if (i > 0) callbacks.splice(i);

          resolve(output);
        }
      }

      callbacks.push(callback);
    });
  }

  const serverInternal = {
    process: serverProcess,
    request,
    ready: request("ok?", (res) => res === "ok" || res === "boot").then(() => {
      boot = true;
    }),
    isExit: false,
  };

  void serverProcess.exit.then(() => {
    serverInternal.isExit = true;
  });

  return serverInternal;
}
