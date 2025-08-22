import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-markdown-links";
export const meta: PluginMeta = {
  description: "ESLint plugin that checks links in Markdown.",
  repo: "https://github.com/ota-meshi/eslint-plugin-markdown-links",
  lang: ["markdown"],
};
export const devDependencies = {
  [name]: "latest",
  "@eslint/markdown": "latest",
};
export const eslintConfig: ESLintConfig<"markdownLinks"> = {
  *imports({ type, i, require }) {
    yield type === "module"
      ? i(`import markdownLinks from "${name}"`)
      : require({
          local: "markdownLinks",
          source: name,
        });
  },
  async *expression(names, helper) {
    yield await helper.x(`${names.markdownLinks}.configs.recommended`);
    yield await helper.x(
      JSON.stringify({
        // Ensure the config applies to markdown files
        files: ["**/*.md"],
        rules: {
          "markdown-links/no-dead-urls": ["error"],
        },
      }),
    );
  },
};
