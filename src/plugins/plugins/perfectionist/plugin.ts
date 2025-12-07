import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-perfectionist";
export const meta: PluginMeta = {
  description:
    "ESLint plugin for sorting various data such as objects, imports, types, enums, JSX props, etc.",
  repo: "https://github.com/azat-io/eslint-plugin-perfectionist",
};
export const devDependencies = { [name]: "latest" };
const importName = "perfectionist";
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
    yield helper.x(`${names[importName]}.configs['recommended-natural']`);
  },
};
