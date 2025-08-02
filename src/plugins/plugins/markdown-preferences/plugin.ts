import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-markdown-preferences";
export const meta: PluginMeta = {
  description: "ESLint plugin that enforces our markdown preferences.",
  repo: "https://github.com/ota-meshi/eslint-plugin-markdown-preferences",
  lang: ["markdown"],
};
export const devDependencies = {
  [name]: "latest",
  "@eslint/markdown": "latest",
};
export const eslintConfig: ESLintConfig<"markdownPreferences"> = {
  *imports({ type, i, require }) {
    yield type === "module"
      ? i(`import markdownPreferences from "${name}"`)
      : require({
          local: "markdownPreferences",
          source: name,
        });
  },
  async *expression(names, helper) {
    yield await helper.x(`${names.markdownPreferences}.configs.recommended`);
    yield await helper.x(
      JSON.stringify({
        files: ["**/*.md"],
        rules: {
          "markdown-preferences/prefer-linked-words": [
            "error",
            {
              words: {
                Vue: "https://vuejs.org",
                React: "https://reactjs.org",
                Angular: "https://angular.io",
                ESLint: "https://eslint.org",
                Prettier: "https://prettier.io",
              },
            },
          ],
        },
      }),
    ); // Ensure the config applies to markdown files
  },
};
