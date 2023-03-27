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
        const ruleUrl = ruleMetadata[msg.ruleId!]?.docs?.url;

        const li = document.createElement("li");

        li.classList.add("ep-warning-item");

        const severity = document.createElement("span");

        severity.textContent = msg.severity === 1 ? "⚠️" : "❌";
        severity.classList.add(`ep-severity-${msg.severity}`);
        li.appendChild(severity);

        const message = document.createElement("span");
        message.textContent = `${msg.message.trim()}`;
        li.appendChild(message);

        const ruleLinkText = `(${msg.ruleId})`;
        if (ruleUrl) {
          const ruleLink = document.createElement("a");
          ruleLink.textContent = ruleLinkText;
          ruleLink.href = ruleUrl;
          ruleLink.target = "_blank";
          li.appendChild(ruleLink);
        } else {
          message.textContent = ` ${ruleLinkText}`;
        }

        const lineNumbers = document.createElement("span");
        const pos = formatPosition(msg);

        lineNumbers.textContent = `[${pos}]`;
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

function formatPosition(message: Linter.LintMessage) {
  const start = `${message.line}:${message.column}`;
  if (message.endLine == null || message.endColumn == null) {
    return start;
  }
  if (message.endLine === message.line) {
    return `${start}-${message.endColumn}`;
  }
  return `${start}-${message.endLine}:${message.endColumn}`;
}
