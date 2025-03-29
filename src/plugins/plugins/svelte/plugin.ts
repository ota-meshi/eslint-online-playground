import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-svelte";
export const description = "ESLint plugin for Svelte using AST.";
export const repo = "https://github.com/sveltejs/eslint-plugin-svelte";
export const devDependencies = { [name]: "latest", svelte: "latest" };
export const eslintConfig: ESLintConfig<"svelte"> = {
  *imports({ type, i, require }) {
    yield type === "module"
      ? i(`import svelte from "${name}"`)
      : require({
          local: "svelte",
          source: name,
        });
  },
  async *expression(names, helper) {
    yield helper.spread(await helper.x(`${names.svelte}.configs.recommended`));
  },
};
export const meta: PluginMeta = { lang: "svelte" };
