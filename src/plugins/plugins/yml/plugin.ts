import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-yml";
export const meta: PluginMeta = {
  description: "This ESLint plugin provides linting rules for YAML.",
  repo: "https://github.com/ota-meshi/eslint-plugin-yml",
  lang: ["yaml"],
};
export const devDependencies = { [name]: "latest" };
const importName = "yml";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(`import ${importName} from '${name}'`);
    } else {
      yield helper.require({ local: importName, source: name });
    }
  },
  async *expression(names, helper) {
    yield helper.spread(
      await helper.x(`${names[importName]}.configs.standard`),
    );
  },
};
