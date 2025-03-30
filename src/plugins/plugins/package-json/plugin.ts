import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-package-json";
export const meta: PluginMeta = {
  description:
    "Rules for consistent, readable, and valid package.json files. 🗂️",
  repo: "https://github.com/JoshuaKGoldberg/eslint-plugin-package-json",
  lang: ["json"],
};
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  overrides: [
    {
      extends: ["plugin:package-json/legacy-recommended"],
      files: ["package.json"],
      parser: "jsonc-eslint-parser",
    },
  ],
};
const importName = "packageJson";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(`import ${importName} from '${name}'`);
    } else {
      yield helper.require({
        local: importName,
        source: name,
      });
    }
  },
  *expression(names, helper) {
    yield helper.x(`${names[importName]}.configs.recommended`);
  },
};
