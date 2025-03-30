import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-json-schema-validator";
export const meta: PluginMeta = {
  description: "ESLint plugin that validates data using JSON Schema Validator.",
  repo: "https://github.com/ota-meshi/eslint-plugin-json-schema-validator",
  lang: ["json", "yaml", "toml"],
};
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:json-schema-validator/recommended"],
};
const importName = "jsonSchemaValidator";
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
      await helper.x(`${names[importName]}.configs["flat/recommended"]`),
    );
  },
};
