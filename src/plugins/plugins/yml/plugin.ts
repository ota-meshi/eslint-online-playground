import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-yml";
export const description =
  "This ESLint plugin provides linting rules for YAML.";
export const repo = "https://github.com/ota-meshi/eslint-plugin-yml";
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:yml/standard"],
};
const importName = "yml";
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
  lang: ["yaml"],
};
