<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import ESLintPlayground from "./components/ESLintPlayground.vue";
import SelectExampleDialog from "./components/SelectExampleDialog.vue";
import { compress, decompress } from "./utils/compress";
import { debounce } from "./utils/debounce";
import defaultJs from "./examples/eslint/src/example.js.txt?raw";
import defaultConfig from "./examples/eslint/_eslintrc.json.js";
import defaultPackageJson from "./examples/eslint/package.json.js";
import github from "./images/github.svg";
import logo from "./images/logo.png";
import { CONFIG_FILE_NAMES } from "./utils/eslint-info";
import type { Example } from "./examples";

const selectExampleDialog = ref<InstanceType<
  typeof SelectExampleDialog
> | null>(null);

const hashData = window.location.hash.slice(
  window.location.hash.indexOf("#") + 1
);
const queryParam = decompress(hashData);

const sources = ref<Record<string, string>>({ ...queryParam });

if (CONFIG_FILE_NAMES.every((nm) => !sources.value[nm])) {
  sources.value[".eslintrc.json"] = JSON.stringify(defaultConfig, null, 2);
}
if (sources.value["package.json"] === undefined) {
  sources.value["package.json"] = JSON.stringify(defaultPackageJson, null, 2);
}

if (
  Object.keys(sources.value).filter(
    (k) => k !== ".eslintrc.json" && k !== "package.json"
  ).length === 0
) {
  sources.value["src/example.js"] = defaultJs;
}

function selectExample() {
  selectExampleDialog.value?.open();
}

async function handleSelectExample(example: Example) {
  // Update dependencies first.
  sources.value["package.json"] = example.files["package.json"];
  await nextTick();
  sources.value = { ...example.files };
}

watch(
  sources,
  debounce(() => {
    const query = compress(sources.value);

    window.location.hash = query;

    if (window.parent) {
      window.parent.postMessage(query, "*");
    }
  }, 300),
  { deep: true }
);
</script>

<template>
  <header class="header">
    <div class="title">
      <a href="https://eslint.org/"> ESLint </a>
      Online Playground
    </div>
    <div class="header-menu">
      <button class="ep-button" @click="selectExample">More Examples</button>
      <a
        class="github"
        target="_blank"
        href="https://github.com/ota-meshi/eslint-plugin-n-playground"
      >
        <img :src="github" alt="GitHub" />
      </a>
    </div>
  </header>
  <ESLintPlayground v-model:sources="sources" />
  <footer class="footer">
    <a href="https://github.com/eslint-community">
      <img class="logo" :src="logo" alt="ESLint Community" />
    </a>
  </footer>
  <SelectExampleDialog
    ref="selectExampleDialog"
    @select="handleSelectExample"
  ></SelectExampleDialog>
</template>

<style scoped>
.header {
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-family: system-ui;
  color: var(--color-neutral-900);
  font-size: 1.2rem;
  font-weight: 500;
}
.title a {
  color: var(--color-primary-800);
  text-decoration: none;
}
.header-menu {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
}

.github {
  display: block;
  width: 24px;
  height: 24px;
}

.footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 12px;
}

.logo {
  height: 50px;
}
</style>
