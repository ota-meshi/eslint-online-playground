import type { ESLintConfig, PluginMeta } from "../..";

export const name = "@intlify/eslint-plugin-svelte";
export const meta: PluginMeta = {
  description: "ESLint plugin for internationalization with Svelte.",
  repo: "https://github.com/intlify/eslint-plugin-svelte",
  lang: ["svelte"],
};
export const devDependencies = { [name]: "latest", svelte: "latest" };
const importName = "intlifySvelte";
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
      await helper.x(`${names[importName]}.configs.recommended`),
    );
  },
};
