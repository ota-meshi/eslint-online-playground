<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Plugin } from "../plugins";
import { loadPlugins } from "../plugins";
import GitHubIcon from "./GitHubIcon.vue";
import NpmIcon from "./NpmIcon.vue";
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
const selectLanguage = ref<string>("$all$");
const filteredPlugins = computed(() =>
  selectLanguage.value === "$all$"
    ? availablePlugins.value
    : availablePlugins.value.filter((plugin) =>
        plugin.meta?.lang?.includes(selectLanguage.value),
      ),
);

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
        <div>
          <span class="carbon--filter"></span>
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
              availablePlugins.length
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
                availablePlugins.filter((plugin) =>
                  plugin.meta?.lang?.includes(lang),
                ).length
              }}</span>
            </label>
          </template>
        </div>
      </div>
    </div>
    <div class="ep-select-plugin__list" @click.stop>
      <template v-if="availablePlugins.length">
        <div
          v-for="plugin in filteredPlugins"
          :key="plugin.name"
          class="ep-select-plugin__item"
        >
          <label class="ep-select-plugin__item-meta">
            <input
              v-model="selectPlugins"
              type="checkbox"
              :value="plugin.name"
            />
            <div class="ep-select-plugin__item-title">{{ plugin.name }}</div>
            <template v-if="plugin.meta?.description">
              <div>
                {{ plugin.meta.description }}
              </div>
            </template>
            <template v-if="plugin.meta">
              <span
                v-if="plugin.meta.lang"
                class="ep-select-plugin__item-langs"
              >
                <template v-for="lang in plugin.meta.lang" :key="lang">
                  <span class="ep-select-plugin__item-lang">{{ lang }}</span>
                </template>
              </span>
            </template>
          </label>
          <a
            v-if="plugin.meta?.repo"
            class="ep-select-plugin__link-icon"
            target="_blank"
            :href="plugin.meta.repo"
            @click.stop
          >
            <GitHubIcon alt="GitHub" />
          </a>
          <a
            class="ep-select-plugin__link-icon"
            target="_blank"
            :href="`https://www.npmjs.com/package/${plugin.meta?.package || plugin.name}`"
            @click.stop
          >
            <NpmIcon alt="npm" />
          </a>
        </div>
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
  padding-block: 1rem;
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
  padding: 0 1rem 0.5rem 1rem;
}

.ep-select-plugin__filter {
  display: flex;
  gap: 8px;
  padding-inline: 1rem;
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

.ep-select-plugin__item-meta {
  display: flex;
  gap: 16px;
  align-items: center;
}

.ep-select-plugin__item-title {
  font-weight: bold;
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
}

.dark .ep-select-plugin__item-lang {
  color: var(--color-primary-300);
}

.ep-select-plugin__link-icon {
  display: flex;
}

.ep-select-plugin__foot {
  flex-shrink: 0;
  border-top: 1px solid var(--ep-border-color);
  padding: 0.5rem 1rem 0 1rem;
}

.carbon--filter {
  display: inline-block;
  width: 1em;
  height: 1em;
  --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='%23000' d='M18 28h-4a2 2 0 0 1-2-2v-7.59L4.59 11A2 2 0 0 1 4 9.59V6a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v3.59a2 2 0 0 1-.59 1.41L20 18.41V26a2 2 0 0 1-2 2M6 6v3.59l8 8V26h4v-8.41l8-8V6Z'/%3E%3C/svg%3E");
  background-color: currentColor;
  -webkit-mask-image: var(--svg);
  mask-image: var(--svg);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
}
</style>
