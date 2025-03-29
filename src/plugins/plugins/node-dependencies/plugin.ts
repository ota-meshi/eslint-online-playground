import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-node-dependencies";
export const description = "ESLint plugin to check Node.js dependencies.";
export const repo =
  "https://github.com/ota-meshi/eslint-plugin-node-dependencies";
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:node-dependencies/recommended"],
};
const importName = "nodeDependencies";
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
      await helper.x(`${names[importName]}.configs['flat/recommended']`),
    );
  },
};
export const meta: PluginMeta = {
  lang: ["json"],
};
