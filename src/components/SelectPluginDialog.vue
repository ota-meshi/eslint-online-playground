<script setup lang="ts">
import { ref, computed } from "vue";
import type { Plugin } from "../plugins";
import { loadPlugins } from "../plugins";
import GitHubIcon from "./GitHubIcon.vue";
import { loadingWith } from "../utils/loading";

const plugins = ref<Record<string, Plugin>>({});
const dialogRef = ref<HTMLDialogElement>();
const selectPlugins = ref<string[]>([]);
const packageJson = ref({});
const availablePlugins = computed(() => {
  return Object.values(plugins.value).filter(
    (p) => !p.hasInstalled || !p.hasInstalled(packageJson.value),
  );
});

const emit = defineEmits<(type: "select", plugins: Plugin[]) => void>();

defineExpose({
  open,
});

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
    <div class="ep-select-plugin__list" @click.stop>
      <template v-if="availablePlugins.length">
        <div
          v-for="plugin in availablePlugins"
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
            <template v-if="plugin.description">
              <div>
                {{ plugin.description }}
              </div>
            </template>
            <template v-if="plugin.meta">
              <span
                v-if="plugin.meta.lang"
                class="ep-select-plugin__item-langs"
              >
                <template
                  v-for="lang in [plugin.meta.lang].flat(Infinity)"
                  :key="lang"
                >
                  <span class="ep-select-plugin__item-lang">{{ lang }}</span>
                </template>
              </span>
            </template>
          </label>
          <a
            v-if="plugin.repo"
            class="github"
            target="_blank"
            :href="plugin.repo"
            @click.stop
          >
            <GitHubIcon alt="GitHub" />
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

      <button class="ep-button" @click="handleOk">OK</button>
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
}

.ep-select-plugin__list {
  gap: 8px;
  display: flex;
  flex-direction: column;
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
  border-radius: 1em;
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

.github {
  display: flex;
}
</style>
