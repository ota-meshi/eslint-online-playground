import type { WebContainer, WebContainerProcess } from "@webcontainer/api";

import type ConsoleOutput from "../components/ConsoleOutput.vue";
import type TabsPanel from "../components/TabsPanel.vue";
import { detectPackageManager } from "../utils/lock-file";

export class Installer {
  private readonly webContainer: WebContainer;

  private readonly consoleOutput: InstanceType<typeof ConsoleOutput>;

  private readonly outputTabs: InstanceType<typeof TabsPanel>;

  private running = false;

  private installProcess: Promise<WebContainerProcess> | undefined;

  public constructor({
    consoleOutput,
    outputTabs,
    webContainer,
  }: {
    webContainer: WebContainer;
    consoleOutput: InstanceType<typeof ConsoleOutput>;
    outputTabs: InstanceType<typeof TabsPanel>;
  }) {
    this.webContainer = webContainer;
    this.consoleOutput = consoleOutput;
    this.outputTabs = outputTabs;
  }

  /** Run `npm install` to install dependencies. */
  public async install(): Promise<number> {
    this.outputTabs.setChecked("console");
    this.consoleOutput.appendLine("Installing dependencies...");

    if (this.installProcess != null) {
      if (this.running)
        this.consoleOutput.appendLine(
          "Kill the previous installation process.",
        );
      (await this.installProcess).kill();
    }

    this.installProcess = this.#installDependencies();

    return (await this.installProcess).exit;
  }

  /** Returns the exit code for the install command process. */
  public async getExitCode(): Promise<number> {
    return (await this.installProcess!).exit;
  }

  async #installDependencies() {
    const packageManager = detectPackageManager(
      await this.webContainer.fs.readdir(""),
    );

    this.running = true;
    const installProcess = await this.webContainer.spawn(packageManager, [
      "install",
      "-f",
    ]);

    void installProcess.output.pipeTo(
      new WritableStream({
        write: (data) => {
          this.consoleOutput.append(data);
        },
      }),
    );
    void installProcess.exit.then((exitCode) => {
      this.running = false;
      if (exitCode !== 0) {
        this.consoleOutput.appendLine("Installation failed.");
      } else {
        this.consoleOutput.appendLine("Installation succeeded.");
      }
    });

    return installProcess;
  }
}
