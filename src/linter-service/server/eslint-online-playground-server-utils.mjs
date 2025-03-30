const DIRECTIVE_OPEN = "{{{ep-json-start}}}";
const DIRECTIVE_CLOSE = "{{{ep-json-end}}}";

/**
 * @typedef {'data' | 'warn'} PayloadType
 */

export const FLAT_CONFIG_FILE_NAMES = /** @type {const} */ ([
  "eslint.config.js",
  "eslint.config.cjs",
  "eslint.config.mjs",
  "eslint.config.ts",
  "eslint.config.cts",
  "eslint.config.mts",
]);
export const LEGACY_CONFIG_FILE_NAMES = /** @type {const} */ ([
  ".eslintrc",
  ".eslintrc.cjs",
  ".eslintrc.js",
  ".eslintrc.json",
  ".eslintrc.yaml",
  ".eslintrc.yml",
]);
export const CONFIG_FILE_NAMES = [
  ...FLAT_CONFIG_FILE_NAMES,
  ...LEGACY_CONFIG_FILE_NAMES,
];
const RESERVED_FILE_NAMES = [
  "eslint-online-playground-server.mjs",
  "eslint-online-playground-server-utils.mjs",
  "package-lock.json",
  "node_modules",
  ...CONFIG_FILE_NAMES,
  ".eslintignore",
];
/**
 * If the value is JSON enclosed in directives, extract the value and parse the JSON to get the value.
 * @param {string} str
 * @returns {{type: PayloadType, payload: any} | null}
 */
export function extractJson(str) {
  if (!str.startsWith(DIRECTIVE_OPEN) || !str.endsWith(DIRECTIVE_CLOSE)) {
    return null;
  }

  return JSON.parse(str.slice(DIRECTIVE_OPEN.length, -DIRECTIVE_CLOSE.length));
}

/**
 * Make the payload a string enclosed in directives.
 * @param {any} payload
 * @param {object} [options]
 * @param {(key: string, value: any) => any} [options.replacer]
 * @param {PayloadType} [options.type]
 */
export function createJsonPayload(payload, { replacer, type } = {}) {
  return (
    DIRECTIVE_OPEN +
    JSON.stringify({ type: type ?? "data", payload }, replacer) +
    DIRECTIVE_CLOSE
  );
}

/**
 *
 * @param {string} fileName
 * @returns {boolean}
 */
export function isReservedFileName(fileName) {
  return (
    fileName === "package.json" ||
    RESERVED_FILE_NAMES.some(
      (f) =>
        fileName.endsWith(f) ||
        fileName.includes(`/${f}/`) ||
        fileName.includes(`\\${f}\\`),
    )
  );
}
