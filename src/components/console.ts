import ansiRegex from "ansi-regex";
export type ConsoleOutput = {
  appendLine: (string: string) => void;
  append: (string: string) => void;
  clear: () => void;
};
export type ConsoleOutputOptions = {
  /** Specify a target element to set up the console output. */
  element: HTMLElement;
};

const CHA = "\u001b[1G";

/** Setup a console output component. */
export function setupConsoleOutput({
  element,
}: ConsoleOutputOptions): ConsoleOutput {
  let nextCHA = false;
  const consoleOutput: ConsoleOutput = {
    appendLine: (string: string) => {
      const currContent = (element.textContent =
        element.textContent!.trimEnd());

      consoleOutput.append(`${(currContent ? "\n" : "") + string}\n`);
    },
    append: (string: string) => {
      const ansiRe = ansiRegex();
      let start = 0;

      for (const match of string.matchAll(ansiRe)) {
        if (match[0] === CHA) {
          nextCHA = true;
        }

        append(string.slice(start, match.index));
        start = match.index! + match[0].length;
      }

      append(string.slice(start));
      element.scrollTop = element.scrollHeight;

      function append(s: string) {
        if (!s) return;

        if (nextCHA) {
          const lastLinefeed = element.textContent!.lastIndexOf("\n");

          if (lastLinefeed > -1)
            element.textContent = element.textContent!.slice(
              0,
              lastLinefeed + 1
            );

          nextCHA = false;
        }

        element.textContent += s;
      }
    },
    clear: () => {
      element.textContent = "";
    },
  };

  return consoleOutput;
}
