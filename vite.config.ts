import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "url";
import path from "path";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default defineConfig(() => ({
  plugins: [vue()],
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
}));
