/**
 * The server waits for stdin, and when stdin is received,
 * it starts linting based on that information.
 * The linting result is written to stdout.
 *
 * Always pass data with a directive open prefix and a directive close suffix.
 */
import {
  createJsonPayload,
  extractJson,
  isReservedFileName,
  CONFIG_FILE_NAMES,
  LEGACY_CONFIG_FILE_NAMES,
} from "./eslint-online-playground-server-utils.mjs";
import fs from "fs";
import path from "path";
import { ESLint } from "eslint";

const ROOT_DIR = path.resolve();

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

  process.on("warning", (warning) => {
    process.stdout.write(createJsonPayload(String(warning), { type: "warn" }));
  });

  process.stdin.on("data", (data) => {
    const input = extractJson(data.toString());

    if (!input || input.type !== "data") return;

    // Health check.
    if (input.payload === "ok?") {
      process.stdout.write(createJsonPayload("ok"));

      return;
    }

    // Request linting.
    lint(input.payload);
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

    if (isReservedFileName(targetFile)) {
      throw new Error(
        "The specified file name cannot be used as a linting file name on this demo site.",
      );
    }

    const configFile = path.join(ROOT_DIR, input.configFileName);

    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.mkdirSync(path.dirname(configFile), { recursive: true });

    for (const configFileName of CONFIG_FILE_NAMES) {
      const target = path.join(ROOT_DIR, configFileName);
      if (target === configFile) continue;
      if (fs.existsSync(target)) fs.unlinkSync(target);
    }

    fs.writeFileSync(targetFile, input.code, "utf8");
    fs.writeFileSync(configFile, input.config, "utf8");

    const eslintInstance = await newESLint();
    const eslintInstanceForFix = await newESLint({ fix: true });
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
      createJsonPayload(output, {
        replacer: (key, value) => {
          if (key.startsWith("_")) return undefined;

          return value;
        },
      }),
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

  async function newESLint(options) {
    const version = Number(ESLint.version.split(".")[0]);
    if (version >= 9) {
      // For ESLint v9+
      if (useLegacyConfig()) {
        const mod = await import("eslint/use-at-your-own-risk");
        const { LegacyESLint } = mod.default;
        return new LegacyESLint(options);
      }
      return new ESLint(options);
    }

    // For Old ESLint
    if (useLegacyConfig()) {
      return new ESLint(options);
    }

    const mod = await import("eslint/use-at-your-own-risk");
    const { FlatESLint } = mod.default;
    return new FlatESLint(options);
  }

  function useLegacyConfig() {
    return LEGACY_CONFIG_FILE_NAMES.includes(input.configFileName);
  }
}
