import { expect, describe, test } from "vitest";

import { installPluginForFlatConfig } from "../../../../src/plugins/installer/new-config.ts";

const esmConfigText = `import js from "@eslint/js";
import jsdoc from 'eslint-plugin-jsdoc';
export default [
  js.configs.recommended,
  {
    rules: {
      quotes: ["error", "double"],
    },
  },
];
`;
const cjsConfigText = `const js = require("@eslint/js");
const jsdoc  = require('eslint-plugin-jsdoc');
module.exports =  [
  js.configs.recommended,
  {
    rules: {
      quotes: ["error", "double"],
    },
  },
];
`;

describe("installPluginForFlatConfig with es-x", async () => {
  const plugin = await import("../../../../src/plugins/plugins/es-x/plugin.ts");
  test("esm", async () => {
    const result = await installPluginForFlatConfig(esmConfigText, [plugin]);
    expect(result.configText).toMatchSnapshot();
  });
  test("cjs", async () => {
    const result = await installPluginForFlatConfig(cjsConfigText, [plugin]);
    expect(result.configText).toMatchSnapshot();
  });
});
describe("installPluginForFlatConfig with jsdoc", async () => {
  const plugin = await import(
    "../../../../src/plugins/plugins/jsdoc/plugin.ts"
  );
  test("esm", async () => {
    const result = await installPluginForFlatConfig(esmConfigText, [plugin]);
    expect(result.configText).toMatchSnapshot();
  });
  test("cjs", async () => {
    const result = await installPluginForFlatConfig(cjsConfigText, [plugin]);
    expect(result.configText).toMatchSnapshot();
  });
});
describe("installPluginForFlatConfig with stylistic", async () => {
  const plugin = await import(
    "../../../../src/plugins/plugins/stylistic/plugin.ts"
  );
  test("esm", async () => {
    const result = await installPluginForFlatConfig(esmConfigText, [plugin]);
    expect(result.configText).toMatchSnapshot();
  });
  test("cjs", async () => {
    const result = await installPluginForFlatConfig(cjsConfigText, [plugin]);
    expect(result.configText).toMatchSnapshot();
  });
});
describe("installPluginForFlatConfig with typescript-eslint", async () => {
  const plugin = await import(
    "../../../../src/plugins/plugins/typescript-eslint/plugin.ts"
  );
  test("esm", async () => {
    const result = await installPluginForFlatConfig(esmConfigText, [plugin]);
    expect(result.configText).toMatchSnapshot();
  });
  test("cjs", async () => {
    const result = await installPluginForFlatConfig(cjsConfigText, [plugin]);
    expect(result.configText).toMatchSnapshot();
  });
});
