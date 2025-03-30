import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-astro";
export const meta: PluginMeta = {
  description: "ESLint plugin for Astro components.",
  repo: "https://github.com/ota-meshi/eslint-plugin-astro",
  lang: ["astro"],
};
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:astro/recommended"],
};
export const eslintConfig: ESLintConfig<"astro"> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(`import astro from '${name}'`);
    } else {
      yield helper.require({
        local: "astro",
        source: name,
      });
    }
  },
  async *expression(names, helper) {
    yield helper.spread(await helper.x(`${names.astro}.configs.recommended`));
  },
};
