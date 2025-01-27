import { CONFIG_FILE_NAMES } from "../linter-service/server/eslint-online-playground-server-utils.mjs";

export { CONFIG_FILE_NAMES };
export type ConfigFileName = (typeof CONFIG_FILE_NAMES)[number];
