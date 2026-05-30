import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-json-schema-validator-2";
export const meta: PluginMeta = {
  description: "ESLint rules that validate JSON, YAML, TOML, JavaScript, and Vue custom-block data with JSON Schema.",
  repo: "https://github.com/Nick2bad4u/eslint-plugin-json-schema-validator-2",
  lang: ["json", "yaml", "toml", "javascript", "vue"],
  package: "eslint-plugin-json-schema-validator-2",
};
export const devDependencies = { "eslint-plugin-json-schema-validator-2": "latest" };
const importName = "jsonSchemaValidator2";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i("import jsonSchemaValidator2 from 'eslint-plugin-json-schema-validator-2'");
    } else {
      yield helper.require({ local: importName, source: "eslint-plugin-json-schema-validator-2" });
    }
  },
  async *expression(names, helper) {
    const recommended = names[importName] + ".configs.recommended";
    yield helper.spread(await helper.x(recommended));
  },
};