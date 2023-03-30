<script setup lang="ts">
import { ref, watch } from "vue";
import ESLintPlayground from "./components/ESLintPlayground.vue";
import { compress, decompress } from "./utils/compress";
import { debounce } from "./utils/debounce";
import defaultJs from "./defaults/default.js.txt?raw";
import defaultConfig from "./defaults/config.json";
import defaultPackageJson from "./defaults/package.json.js";

const hashData = window.location.hash.slice(
  window.location.hash.indexOf("#") + 1
);
const queryParam = decompress(hashData);

const {
  code: codeQueryParam,
  fileName: fileNameQueryParam,
  config: configQueryParam,
  packageJson: packageJsonQueryParam,
} = queryParam;

const code = ref<string>(codeQueryParam ?? defaultJs);
const fileName = ref<string>(fileNameQueryParam || "example.js");
const config = ref<string>(
  configQueryParam || JSON.stringify(defaultConfig, null, 2)
);
const packageJson = ref<string>(
  packageJsonQueryParam || JSON.stringify(defaultPackageJson, null, 2)
);

watch(
  [code, fileName, config, packageJson],
  debounce(
    ([code, fileName, config, packageJson]: [
      string,
      string,
      string,
      string
    ]) => {
      const query = compress({ code, fileName, config, packageJson });

      window.location.hash = query;

      if (window.parent) {
        window.parent.postMessage(query, "*");
      }
    },
    300
  )
);
</script>

<template>
  <ESLintPlayground
    v-model:code="code"
    v-model:file-name="fileName"
    v-model:config="config"
    v-model:package-json="packageJson"
  />
</template>
