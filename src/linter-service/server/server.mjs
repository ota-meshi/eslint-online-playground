/**
 * The server waits for stdin, and when stdin is received,
 * it starts linting based on that information.
 * The linting result is written to stdout.
 *
 * Always pass data with a directive open prefix and a directive close suffix.
 */
import { createJsonPayload, extractJson } from "./extract-json.mjs";
import fs from "fs";
import path from "path";
import { ESLint } from "eslint";

const ROOT_DIR = path.resolve();

const RESERVED_FILE_NAMES = [
  "server.mjs",
  "extract-json.mjs",
  "package.json",
  "package-lock.json",
  "node_modules",
  ".eslintrc",
  ".eslintrc.cjs",
  ".eslintrc.js",
  ".eslintrc.json",
  ".eslintrc.yaml",
  ".eslintrc.yml",
  "eslint.config.cjs",
  "eslint.config.js",
  ".eslintignore",
];

/**
 * @typedef {import('../index').LintInput} LintInput
 * @typedef {import('../index').LinterServiceResult} LinterServiceResult
 */

main();

function main() {
  // eslint-disable-next-line no-console -- Demo runtime
  console.log("Start server");

  process.stdin.setEncoding("utf8");
  process.stdin.setRawMode(true);
  process.stdin.resume();

  process.stdin.on("data", (data) => {
    const input = extractJson(data.toString());

    if (!input) return;

    // Health check.
    if (input === "ok?") {
      process.stdout.write(createJsonPayload("ok"));

      return;
    }

    // Request linting.
    lint(input);
  });

  // Notify the start of boot.
  process.stdout.write(createJsonPayload("boot"));
}

/**
 * Linting with eslint
 * @param {LintInput} input
 */
async function lint(input) {
  // eslint-disable-next-line no-console -- Demo runtime
  console.log("Linting file: ", input.fileName);

  try {
    const targetFile = path.normalize(path.join(ROOT_DIR, input.fileName));

    if (!targetFile.startsWith(ROOT_DIR)) {
      throw new Error("An out-of-scope path was specified.");
    }

    if (
      RESERVED_FILE_NAMES.some(
        (f) =>
          targetFile.endsWith(f) ||
          targetFile.includes(`/${f}/`) ||
          targetFile.includes(`\\${f}\\`)
      )
    ) {
      throw new Error(
        "The specified file name cannot be used as a linting file name on this demo site."
      );
    }

    const configFile = path.join(ROOT_DIR, ".eslintrc.json");

    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.mkdirSync(path.dirname(configFile), { recursive: true });

    // for (const configFormat of CONFIG_FORMATS) {
    //   if (configFormat.id === input.configFormat) continue;
    //   const otherConfigFile = path.join(SRC_DIR, configFormat.name);
    //   if (fs.existsSync(otherConfigFile)) fs.unlinkSync(otherConfigFile);
    // }

    fs.writeFileSync(targetFile, input.code, "utf8");
    fs.writeFileSync(configFile, input.config, "utf8");

    const eslintInstance = new ESLint();
    const eslintInstanceForFix = new ESLint({ fix: true });
    const result = (await eslintInstance.lintFiles([targetFile]))[0];
    const fixResult = (await eslintInstanceForFix.lintFiles([targetFile]))[0];
    const fixedFile = fixResult.output ?? input.code;

    /** @type {LinterServiceResult} */
    const output = {
      version: input.version,
      returnCode: 0,
      result,
      fixResult,
      output: /** @type {string} */ (fixedFile),
      ruleMetadata: eslintInstance.getRulesMetaForResults([result]),
    };

    // Write the linting result to the stdout.
    process.stdout.write(
      createJsonPayload(output, (key, value) => {
        if (key.startsWith("_")) return undefined;

        return value;
      })
    );
  } catch (e) {
    // eslint-disable-next-line no-console -- Demo runtime
    console.error(e);
    /** @type {LinterServiceResult} */
    const output = {
      version: input.version,
      returnCode: 1,
      result: /** @type {any} */ (e).message,
    };

    process.stdout.write(createJsonPayload(output));
  }
}
