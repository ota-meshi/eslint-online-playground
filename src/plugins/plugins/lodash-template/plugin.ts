import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-lodash-template";
export const description =
  "ESLint plugin for John Resig-style micro template, Lodash's template, Underscore's template and EJS.";
export const repo =
  "https://github.com/ota-meshi/eslint-plugin-lodash-template";
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:lodash-template/recommended-with-html"],
};
const importName = "lodashTemplate";
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
  async *expression(names, helper) {
    yield helper.x(`{
      files: ["**/*.html"],
      ...${names[importName]}.configs['flat/recommended-with-html']
    }`);
  },
};
export const meta: PluginMeta = {
  lang: ["ejs", "template"],
};
