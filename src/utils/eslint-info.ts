export const CONFIG_FILE_NAMES = [
  ".eslintrc.js",
  ".eslintrc.cjs",
  ".eslintrc.json",
  ".eslintrc.yaml",
  "eslint.config.js",
  "eslint.config.cjs",
  "eslint.config.mjs",
] as const;
export type ConfigFileName = (typeof CONFIG_FILE_NAMES)[number];
