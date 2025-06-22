// eslint-disable-next-line spaced-comment -- triple slash directive
/// <reference types="vitest" />
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "url";
import path from "path";
import unocss from "unocss/vite";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default defineConfig(() => ({
  plugins: [vue(), unocss()],
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  resolve: {
    alias: {
      yaml: path.resolve(dirname, "./node_modules/yaml/browser/index.js"),
      assert: path.join(dirname, "./shim-assert.mjs"),
    },
  },
  test: {
    include: ["test/**/*.ts"],
  },
}));
