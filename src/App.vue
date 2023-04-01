<script setup lang="ts">
import { ref, watch } from "vue";
import ESLintPlayground from "./components/ESLintPlayground.vue";
import { compress, decompress } from "./utils/compress";
import { debounce } from "./utils/debounce";
import defaultJs from "./defaults/src/example.js.txt?raw";
import defaultJs2 from "./defaults/src/example2.js.txt?raw";
import defaultConfig from "./defaults/eslintrc.json.js";
import defaultPackageJson from "./defaults/package.json.js";
import github from "./images/github.svg";
import logo from "./images/logo.png";

const hashData = window.location.hash.slice(
  window.location.hash.indexOf("#") + 1
);
const queryParam = decompress(hashData);

const sources = ref<Record<string, string>>({ ...queryParam });

if (!sources.value[".eslintrc.json"]) {
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
  sources.value["src/example2.js"] = defaultJs2;
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
      <a href="https://github.com/eslint-community/eslint-plugin-n">
        eslint-plugin-n
      </a>
      Online Playground
    </div>
    <a
      class="github"
      target="_blank"
      href="https://github.com/ota-meshi/eslint-plugin-n-playground"
    >
      <img :src="github" alt="GitHub" />
    </a>
  </header>
  <ESLintPlayground v-model:sources="sources" />
  <footer class="footer">
    <a href="https://github.com/eslint-community">
      <img class="logo" :src="logo" alt="ESLint Community" />
    </a>
  </footer>
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
  font-size: 2rem;
  font-size: 1.2rem;
  font-weight: 500;
}
.title a {
  color: var(--color-primary-800);
  text-decoration: none;
}
.github {
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
