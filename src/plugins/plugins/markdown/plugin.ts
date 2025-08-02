import type { ESLintConfig, PluginMeta } from "../..";

export const name = "@eslint/markdown";
export const meta: PluginMeta = {
  description: "The official ESLint language plugin for Markdown.",
  repo: "https://github.com/eslint/markdown",
  lang: ["markdown"],
};
export const devDependencies = { [name]: "latest" };
export const eslintConfig: ESLintConfig<"markdown"> = {
  *imports({ type, i, require }) {
    yield type === "module"
      ? i(`import markdown from "${name}"`)
      : require({
          local: "markdown",
          source: name,
        });
  },
  async *expression(names, helper) {
    yield helper.spread(
      await helper.x(`${names.markdown}.configs.recommended`),
    );
  },
};
