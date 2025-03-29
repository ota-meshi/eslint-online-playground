import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-toml";
export const description =
  "This ESLint plugin provides linting rules for TOML.";
export const repo = "https://github.com/ota-meshi/eslint-plugin-toml";
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:toml/standard"],
};
const importName = "toml";
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
    yield helper.spread(
      await helper.x(`${names[importName]}.configs['flat/standard']`),
    );
  },
};
export const meta: PluginMeta = {
  lang: ["toml"],
};
