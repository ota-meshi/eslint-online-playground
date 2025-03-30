<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import ESLintPlayground from "./components/ESLintPlayground.vue";
import SelectExampleDialog from "./components/SelectExampleDialog.vue";
import SelectPluginDialog from "./components/SelectPluginDialog.vue";
import GitHubIcon from "./components/GitHubIcon.vue";
import ThemeSwitch from "./components/ThemeSwitch.vue";
import { compress } from "./utils/compress";
import { debounce } from "./utils/debounce";
import defaultJs from "./examples/eslint/src/example.js.txt?raw";
import defaultConfig from "./examples/eslint/eslint.config.js.txt?raw";
import defaultPackageJson from "./examples/eslint/package.json.js";
import { CONFIG_FILE_NAMES } from "./utils/eslint-info";
import { installPlugin } from "./plugins";
import type { Plugin } from "./plugins";
import { maybeTSConfig } from "./utils/tsconfig";
import { prettyStringify } from "./utils/json-utils";
import * as href from "./utils/href";
import { isLockFile } from "./utils/lock-file";
import { isRepoEnvFile } from "./utils/evn-file";

const props = defineProps<{
  sources?: Record<string, string>;
}>();

const eslintPlayground = ref<InstanceType<typeof ESLintPlayground> | null>(
  null,
);
const selectExampleDialog = ref<InstanceType<
  typeof SelectExampleDialog
> | null>(null);
const selectPluginDialog = ref<InstanceType<typeof SelectPluginDialog> | null>(
  null,
);

const sources = ref<Record<string, string>>({ ...(props.sources || {}) });

if (CONFIG_FILE_NAMES.every((nm) => !sources.value[nm])) {
  sources.value["eslint.config.js"] = defaultConfig;
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

async function setSources(newSources: Record<string, string>) {
  sources.value = { ...newSources };
  await nextTick();
  const fileName =
    Object.keys(newSources).find(
      (nm) =>
        nm !== "package.json" &&
        !CONFIG_FILE_NAMES.some((configName) => nm.endsWith(configName)) &&
        !maybeTSConfig(nm) &&
        !isLockFile(nm) &&
        !isRepoEnvFile(nm),
    ) || Object.keys(newSources)[0];
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

let lastQueryAndHashData = href.getQueryAndHashData();

watch(
  sources,
  debounce(() => {
    const hashData = compress(sources.value);
    lastQueryAndHashData = { hash: hashData };
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = hashData;
    history.replaceState(null, "", url.toString());
    if (window.parent) {
      window.parent.postMessage(hashData, "*");
    }
  }, 300),
  { deep: true },
);

if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    const queryAndHashData = href.getQueryAndHashData();
    if (
      JSON.stringify(queryAndHashData) !== JSON.stringify(lastQueryAndHashData)
    ) {
      void href.toSources(queryAndHashData).then((sources) => {
        if (sources) {
          void setSources(sources);
        }
      });
    }
  });
}
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
    </div>
  </header>
  <ESLintPlayground ref="eslintPlayground" v-model:sources="sources" />
  <footer class="footer">
    <!-- <a href="https://github.com/eslint-community">
      <img class="logo" :src="logo" alt="ESLint Community" />
    </a> -->
  </footer>
  <SelectExampleDialog ref="selectExampleDialog" @select="setSources" />
  <SelectPluginDialog ref="selectPluginDialog" @select="handleSelectPlugins" />
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

.header-menu a {
  color: var(--ep-link-color);
}

.github {
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
