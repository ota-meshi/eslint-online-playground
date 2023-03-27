import type { LinterServiceResult } from "../linter-service";
import type { Linter } from "eslint";
import ansiRegex from "ansi-regex";

export type WarningsPanelOptions = {
  /** Specify a target element to set up the warnings panel component. */
  element: HTMLElement;
  /** Event listeners. */
  listeners: {
    /** Notify the click event of the warning element. */
    onClickMessage: (warning: Linter.LintMessage) => void;
  };
};
export type WarningsPanel = {
  setResult: (result: LinterServiceResult) => void;
};
/** Setup a component to display warnings. */
export function setupWarningsPanel({
  element,
  listeners,
}: WarningsPanelOptions): WarningsPanel {
  return {
    setResult: (result: LinterServiceResult) => {
      element.innerHTML = "";

      if (result.returnCode !== 0) {
        const li = document.createElement("li");

        li.textContent = result.result.replace(ansiRegex(), "");
        element.appendChild(li);

        return;
      }

      const ruleMetadata = result.ruleMetadata;

      for (const msg of [...result.result.messages].sort(
        (a, b) =>
          a.line - b.line ||
          a.column - b.column ||
          (a.endLine != null && b.endLine != null && a.endLine - b.endLine) ||
          (a.endColumn != null &&
            b.endColumn != null &&
            a.endColumn - b.endColumn) ||
          0
      )) {
        const ruleLinkText = `(${msg.ruleId})`;
        const ruleUrl = ruleMetadata[msg.ruleId!]?.docs?.url;

        const li = document.createElement("li");

        li.classList.add("ep-warning-item");

        const severity = document.createElement("span");

        severity.textContent = msg.severity === 1 ? "⚠️" : "❌";
        severity.classList.add(`ep-severity-${msg.severity}`);
        li.appendChild(severity);

        const message = document.createElement("span");

        li.appendChild(message);

        if (ruleUrl) {
          const index = msg.message.lastIndexOf(ruleLinkText);

          if (index >= 0) {
            message.textContent = `${msg.message.slice(0, index).trim()}`;
          } else {
            message.textContent = `${msg.message.trim()}`;
          }

          const ruleLink = document.createElement("a");

          ruleLink.textContent = ruleLinkText;
          ruleLink.href = ruleUrl;
          ruleLink.target = "_blank";
          li.appendChild(ruleLink);

          // Add a span if the message is included after the rule name.
          if (index >= 0) {
            const afterMessage = msg.message
              .slice(index + ruleLinkText.length)
              .trim();

            if (afterMessage) {
              const afterSpan = document.createElement("span");

              afterSpan.textContent = afterMessage;
              li.appendChild(afterSpan);
              afterSpan.addEventListener("click", () =>
                listeners.onClickMessage(msg)
              );
            }
          }
        } else {
          message.textContent = `${msg.message.trim()}`;
        }

        const lineNumbers = document.createElement("span");
        const ln = formatPosition(msg.line, msg.endLine);
        const col = formatPosition(msg.column, msg.endColumn);

        lineNumbers.textContent = `[${ln}:${col}]`;
        lineNumbers.classList.add("ep-line-numbers");
        li.appendChild(lineNumbers);

        lineNumbers.addEventListener("click", () =>
          listeners.onClickMessage(msg)
        );

        element.appendChild(li);
      }
    },
  };
}

function formatPosition(start: number, end: number | undefined) {
  return start === end || !end ? String(start) : [start, end].join("-");
}
