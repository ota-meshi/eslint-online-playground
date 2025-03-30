import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-svelte";
export const meta: PluginMeta = {
  description: "ESLint plugin for Svelte using AST.",
  repo: "https://github.com/sveltejs/eslint-plugin-svelte",
  lang: ["svelte"],
};
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
