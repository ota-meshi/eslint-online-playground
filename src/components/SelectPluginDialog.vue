<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Plugin } from "../plugins";
import { loadPlugins } from "../plugins";
import { loadingWith } from "../utils/loading";

const languageOrder = [
  "javascript",
  "typescript",
  "jsx",
  "json",
  "vue",
  "svelte",
  "astro",
  "yaml",
  "toml",
  "ejs",
  "template",
];

const plugins = ref<Record<string, Plugin>>({});
const dialogRef = ref<HTMLDialogElement>();
const selectPlugins = ref<string[]>([]);
const packageJson = ref({});
const availablePlugins = computed(() => {
  return Object.values(plugins.value).filter(
    (p) => !p.hasInstalled || !p.hasInstalled(packageJson.value),
  );
});
const availableLanguages = computed(() => {
  return new Set(
    availablePlugins.value
      .map((p) => p.meta!.lang!)
      .flat()
      .filter((l) => l)
      .sort(compareLang),
  );
});
const filterText = ref<string>("");
const selectLanguage = ref<string>("$all$");
const filterWords = computed(() => {
  return filterText.value
    .split(/\s+/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word);
});
const textFilteredPlugins = computed(() => {
  if (!filterWords.value.length) return availablePlugins.value;

  const words = filterWords.value.map((word) => word.toLowerCase());

  function filter(plugin: Plugin) {
    return words.every(
      (text) =>
        plugin.name.toLowerCase().includes(text) ||
        plugin.meta?.description?.toLowerCase().includes(text) ||
        plugin.meta?.package?.toLowerCase().includes(text) ||
        plugin.meta?.lang?.some((lang) => lang.toLowerCase().includes(text)),
    );
  }

  return availablePlugins.value.filter(filter);
});
const filteredPlugins = computed(() => {
  if (selectLanguage.value === "$all$") return textFilteredPlugins.value;

  function filter(plugin: Plugin) {
    return plugin.meta!.lang!.includes(selectLanguage.value);
  }

  return textFilteredPlugins.value.filter(filter);
});

watch(
  () => availablePlugins.value,
  (availablePlugins) => {
    if (
      availablePlugins.every(
        (plugin) =>
          !(plugin.meta?.lang as string[])?.includes(selectLanguage.value),
      )
    ) {
      selectLanguage.value = "$all$";
    }
  },
  { immediate: true },
);

const emit = defineEmits<(type: "select", plugins: Plugin[]) => void>();

defineExpose({
  open,
});

function compareLang(a: string, b: string) {
  if (a === b) return 0;
  const indexA = languageOrder.indexOf(a);
  const indexB = languageOrder.indexOf(b);
  if (indexA !== -1 && indexB !== -1) {
    return indexA - indexB;
  }
  if (indexA !== -1) return -1;
  if (indexB !== -1) return 1;
  return a > b ? 1 : -1;
}

async function open(packageJsonText: string) {
  await loadingWith(async () => {
    plugins.value = await loadPlugins();
    packageJson.value = packageJsonText ? JSON.parse(packageJsonText) : {};
    dialogRef.value?.showModal();
  });
}

function handleOk() {
  dialogRef.value?.close();
  emit(
    "select",
    selectPlugins.value
      .map((nm) => plugins.value?.[nm])
      .filter((p): p is Plugin => Boolean(p)),
  );
  selectPlugins.value = [];
}

function handleClickDialog() {
  dialogRef.value?.close();
}
</script>

<template>
  <dialog ref="dialogRef" class="ep-select-plugin" @click="handleClickDialog">
    <div class="ep-select-plugin__head" @click.stop>
      <div class="ep-select-plugin__filter">
        <div class="ep-select-plugin__filter-left">
          <span class="i-carbon:filter"></span>
        </div>
        <div class="ep-select-plugin__filter-content">
          <div class="ep-select-plugin__filter-text">
            <input
              v-model="filterText"
              type="text"
              class="ep-select-plugin__filter-input"
            />
          </div>
          <div class="ep-select-plugin__lang-filter-items">
            <label
              class="ep-select-plugin__lang-filter-item"
              :class="{
                'ep-select-plugin__lang-filter-item--selected':
                  selectLanguage === '$all$',
              }"
            >
              <input
                v-model="selectLanguage"
                type="radio"
                name="lang"
                value="$all$"
              />
              All
              <span class="ep-select-plugin__lang-filter-item-count">{{
                textFilteredPlugins.length
              }}</span>
            </label>
            <template v-for="lang in availableLanguages" :key="lang">
              <label
                class="ep-select-plugin__lang-filter-item"
                :class="{
                  'ep-select-plugin__lang-filter-item--selected':
                    selectLanguage === lang,
                }"
              >
                <input
                  v-model="selectLanguage"
                  type="radio"
                  name="lang"
                  :value="lang"
                />
                {{ lang }}
                <span class="ep-select-plugin__lang-filter-item-count">{{
                  textFilteredPlugins.filter((plugin) =>
                    plugin.meta?.lang?.includes(lang),
                  ).length
                }}</span>
              </label>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div class="ep-select-plugin__list" @click.stop>
      <template v-if="filteredPlugins.length">
        <label
          v-for="plugin in filteredPlugins"
          :key="plugin.name"
          class="ep-select-plugin__item"
        >
          <input v-model="selectPlugins" type="checkbox" :value="plugin.name" />
          <div class="ep-select-plugin__item-section">
            <div class="ep-select-plugin__item-title">{{ plugin.name }}</div>
            <template v-if="plugin.meta?.description">
              <div>
                {{ plugin.meta.description }}
              </div>
            </template>
          </div>
          <div class="ep-select-plugin__item-section">
            <template v-if="plugin.meta">
              <span
                v-if="plugin.meta.lang"
                class="ep-select-plugin__item-langs"
              >
                <template v-for="lang in plugin.meta.lang" :key="lang">
                  <span
                    class="ep-select-plugin__item-lang"
                    @click.stop.prevent="() => (selectLanguage = lang)"
                    >{{ lang }}</span
                  >
                </template>
              </span>
            </template>
            <div class="ep-select-plugin__item-section">
              <a
                v-if="plugin.meta?.repo"
                class="ep-select-plugin__link-icon"
                target="_blank"
                :href="plugin.meta.repo"
                @click.stop
              >
                <div alt="GitHub" class="i-icon-park-outline:github" />
              </a>
              <a
                class="ep-select-plugin__link-icon"
                target="_blank"
                :href="`https://www.npmjs.com/package/${plugin.meta?.package || plugin.name}`"
                @click.stop
              >
                <div alt="npm" class="i-fa-brands:npm" />
              </a>
            </div>
          </div>
        </label>
      </template>
      <template v-else>
        <p>
          There are no additional plugins that can be installed.<br />
          Add any plugins you want to add yourself to the dependencies in
          <code>package.json</code> and install them.
        </p>
      </template>
    </div>
    <div class="ep-select-plugin__foot" @click.stop>
      <button class="ep-button" @click="handleOk">INSTALL</button>
    </div>
  </dialog>
</template>

<style scoped>
.ep-select-plugin {
  color: var(--ep-color);
  background-color: var(--ep-dialog-background-color);
  border: 1px solid var(--ep-border-color);
  border-radius: 2px;
  font-size: 0.75rem;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  flex-direction: column;
  position: relative;
  gap: 8px;
  margin: 1rem auto auto auto;
  min-width: 1100px;
  min-width: min(calc(100vw - 2em - 6px), 1100px);
}

.ep-select-plugin :deep(a) {
  color: var(--ep-link-color);
  text-decoration: none;
}

.ep-select-plugin[open] {
  display: flex;
}

.ep-select-plugin__head {
  flex-shrink: 0;
  border-bottom: 1px solid var(--ep-border-color);
  padding: 1rem 1rem 0.5rem;
}

.ep-select-plugin__filter {
  display: flex;
  gap: 8px;
  /* padding-inline: 1rem; */
}

.ep-select-plugin__filter-left {
  display: flex;
  align-items: center;
}

.ep-select-plugin__filter-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-grow: 1;
}

.ep-select-plugin__filter-text input {
  width: 100%;
  box-sizing: border-box;
}

.ep-select-plugin__lang-filter-items {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ep-select-plugin__lang-filter-item {
  border-radius: 1em;
  padding-inline: 0.5em;
  border-width: 1px;
  border-style: solid;
  border-color: rgb(from var(--color-primary-500) r g b / 0.14);
  color: var(--color-primary-900);
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ep-select-plugin__lang-filter-item--selected {
  background-color: rgb(from var(--color-primary-500) r g b / 0.14);
  border-color: transparent;
}

.dark .ep-select-plugin__lang-filter-item {
  color: var(--color-primary-300);
}

.ep-select-plugin__lang-filter-item input {
  display: none;
}

.ep-select-plugin__lang-filter-item-count {
  font-size: 0.75em;
  line-height: 1em;
}

.ep-select-plugin__list {
  gap: 8px;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding-inline: 1rem;
}

.ep-select-plugin__item {
  display: flex;
  gap: 16px;
  align-items: center;
}

.ep-select-plugin__item:has(+ .ep-select-plugin__item) {
  border-bottom: 1px solid var(--ep-border-color);
}

.ep-select-plugin__item-section {
  display: flex;
  column-gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.ep-select-plugin__item-title {
  font-weight: bold;
  white-space: nowrap;
}

.ep-select-plugin__item-langs {
  display: flex;
  gap: 4px;
}

.ep-select-plugin__item-lang {
  border-radius: 5em;
  padding-inline: 0.5em;
  border-width: 1px;
  border-style: solid;
  border-color: transparent;
  color: var(--color-primary-900);
  background-color: rgb(from var(--color-primary-500) r g b / 0.14);
  cursor: pointer;
}

.dark .ep-select-plugin__item-lang {
  color: var(--color-primary-300);
}

.ep-select-plugin__link-icon {
  display: flex;
  font-size: 1.5em;
}

.ep-select-plugin__foot {
  flex-shrink: 0;
  border-top: 1px solid var(--ep-border-color);
  padding: 0.5rem 1rem 1rem;
}
</style>
