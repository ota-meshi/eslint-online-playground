<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import ESLintPlayground from "./components/ESLintPlayground.vue";
import SelectExampleDialog from "./components/SelectExampleDialog.vue";
import SelectPluginDialog from "./components/SelectPluginDialog.vue";
import GitHubIcon from "./components/GitHubIcon.vue";
import NetlifyBadge from "./components/NetlifyBadge.vue";
import ThemeSwitch from "./components/ThemeSwitch.vue";
import { compress, decompress } from "./utils/compress";
import { debounce } from "./utils/debounce";
import defaultJs from "./examples/eslint/src/example.js.txt?raw";
import defaultConfig from "./examples/eslint/_eslintrc.json.js";
import defaultPackageJson from "./examples/eslint/package.json.js";
import { CONFIG_FILE_NAMES } from "./utils/eslint-info";
import type { Example } from "./examples";
import { installPlugin } from "./plugins";
import type { Plugin } from "./plugins";
import { maybeTSConfig } from "./utils/tsconfig";
import { prettyStringify } from "./utils/json-utils";

const eslintPlayground = ref<InstanceType<typeof ESLintPlayground> | null>(
  null,
);
const selectExampleDialog = ref<InstanceType<
  typeof SelectExampleDialog
> | null>(null);
const selectPluginDialog = ref<InstanceType<typeof SelectPluginDialog> | null>(
  null,
);

const hashData = window.location.hash.slice(
  window.location.hash.indexOf("#") + 1,
);
const queryParam = decompress(hashData);

const sources = ref<Record<string, string>>({ ...queryParam });

if (CONFIG_FILE_NAMES.every((nm) => !sources.value[nm])) {
  sources.value[".eslintrc.json"] = prettyStringify(defaultConfig);
}
if (sources.value["package.json"] === undefined) {
  sources.value["package.json"] = prettyStringify(defaultPackageJson);
}

if (
  Object.keys(sources.value).filter(
    (k) =>
      !(CONFIG_FILE_NAMES as readonly string[]).includes(k) &&
      k !== "package.json",
  ).length === 0
) {
  sources.value["src/example.js"] = defaultJs;
}

function selectExample() {
  selectExampleDialog.value?.open();
}

function selectPlugin() {
  selectPluginDialog.value?.open(sources.value["package.json"]);
}

async function handleSelectExample(example: Example) {
  sources.value = { ...example.files };
  await nextTick();
  const fileName =
    Object.keys(example.files).find(
      (nm) =>
        nm !== "package.json" &&
        !CONFIG_FILE_NAMES.some((configName) => nm.endsWith(configName)) &&
        !maybeTSConfig(nm),
    ) || Object.keys(example.files)[0];
  eslintPlayground.value?.selectFile(fileName);
}

async function handleSelectPlugins(plugins: Plugin[]) {
  if (!plugins.length) {
    return;
  }
  const newSources = { ...sources.value };
  const configFileName =
    CONFIG_FILE_NAMES.find((nm) => newSources[nm]) || ".eslintrc.json";

  const installResult = await installPlugin(
    newSources["package.json"] || "{}",
    newSources[configFileName] || "{}",
    configFileName,
    plugins,
  );
  if (installResult.error) {
    return;
  }
  // eslint-disable-next-line require-atomic-updates -- OK
  newSources["package.json"] = installResult.packageJson;
  // eslint-disable-next-line require-atomic-updates -- OK
  newSources[configFileName] = installResult.configText;

  // eslint-disable-next-line require-atomic-updates -- OK
  sources.value = newSources;
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
  { deep: true },
);
</script>

<template>
  <header class="header">
    <div class="title">
      <a href="https://github.com/eslint-community/">
        <img class="community-logo" src="/icon.svg" />
      </a>
      <a href="https://eslint.org/"> ESLint </a>
      Online Playground
    </div>
    <div class="header-menu">
      <button class="ep-button" @click="selectPlugin">More Plugins</button>
      <button class="ep-button" @click="selectExample">More Examples</button>
      <ThemeSwitch />
      <a
        class="github"
        target="_blank"
        href="https://github.com/ota-meshi/eslint-online-playground"
      >
        <GitHubIcon alt="GitHub" />
      </a>
      <a class="netlify" href="https://www.netlify.com" target="_blank">
        <NetlifyBadge alt="Deploys by Netlify" />
      </a>
    </div>
  </header>
  <ESLintPlayground v-model:sources="sources" ref="eslintPlayground" />
  <footer class="footer">
    <!-- <a href="https://github.com/eslint-community">
      <img class="logo" :src="logo" alt="ESLint Community" />
    </a> -->
  </footer>
  <SelectExampleDialog
    ref="selectExampleDialog"
    @select="handleSelectExample"
  ></SelectExampleDialog>
  <SelectPluginDialog
    ref="selectPluginDialog"
    @select="handleSelectPlugins"
  ></SelectPluginDialog>
</template>

<style scoped>
.header {
  padding: 0 0 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-family: system-ui;
  color: var(--title-color);
  font-size: 1.2rem;
  font-weight: 500;
}
.title a {
  color: var(--title-link-color);
  text-decoration: none;
}

.community-logo {
  height: 22px;
  vertical-align: bottom;
}

.header-menu {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px;
}

.github {
  display: flex;
}
.netlify {
  display: flex;
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
