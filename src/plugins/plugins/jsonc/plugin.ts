import type { ESLintConfig, PluginMeta } from "../..";

export const name = "eslint-plugin-jsonc";
export const meta: PluginMeta = {
  description: "ESLint plugin for JSON(C|5)? files.",
  repo: "https://github.com/ota-meshi/eslint-plugin-jsonc",
  lang: ["json"],
};
export const devDependencies = { [name]: "latest" };
const importName = "jsonc";
export const eslintConfig: ESLintConfig<typeof importName> = {
  *imports(helper) {
    if (helper.type === "module") {
      yield helper.i(`import ${importName} from '${name}'`);
    } else {
      yield helper.require({ local: importName, source: name });
    }
  },
  async *expression(names, helper) {
    yield helper.spread(
      await helper.x(
        `${names[importName]}.configs['recommended-with-json'].map((config) => ({ ...config, files: ["**/*.json"] }))`,
      ),
    );
    yield helper.spread(
      await helper.x(
        `${names[importName]}.configs['recommended-with-jsonc'].map((config) => ({ ...config, files: ["**/*.jsonc", "**/tsconfig.json", "**/tsconfig.*.json"] }))`,
      ),
    );
    yield helper.spread(
      await helper.x(
        `${names[importName]}.configs['recommended-with-json5'].map((config) => ({ ...config, files: ["**/*.json5"] }))`,
      ),
    );
  },
};
