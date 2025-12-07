import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-de-morgan";
export const meta: PluginMeta = {
  description:
    "ESLint plugin that enforces logical consistency using De Morgan's laws.",
  repo: "https://github.com/azat-io/eslint-plugin-de-morgan",
};
export const devDependencies = { [name]: "latest" };
const importName = "deMorgan";
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
