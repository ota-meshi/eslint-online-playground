export const CONFIG_FILE_NAMES = [
  ".eslintrc.js",
  ".eslintrc.json",
  ".eslintrc.yaml",
  "eslint.config.js",
] as const;
export type ConfigFileName = (typeof CONFIG_FILE_NAMES)[number];
