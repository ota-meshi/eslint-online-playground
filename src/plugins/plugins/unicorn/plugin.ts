import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-unicorn";
export const meta: PluginMeta = {
  description: "More than 100 powerful ESLint rules.",
  repo: "https://github.com/sindresorhus/eslint-plugin-unicorn",
};
export const devDependencies = { [name]: "latest" };
const importName = "eslintPluginUnicorn";
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
