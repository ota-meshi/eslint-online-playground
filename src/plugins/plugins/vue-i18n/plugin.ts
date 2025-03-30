import type { ESLintConfig, ESLintLegacyConfig, PluginMeta } from "../..";

export const name = "@intlify/eslint-plugin-vue-i18n";
export const meta: PluginMeta = {
  description: "🌐 ESLint plugin for Vue I18n.",
  repo: "https://github.com/intlify/eslint-plugin-vue-i18n",
  lang: ["vue"],
};
export const devDependencies = { [name]: "latest" };
export const eslintLegacyConfig: ESLintLegacyConfig = {
  extends: ["plugin:@intlify/vue-i18n/recommended-legacy"],
};
const importName = "vueI18n";
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
