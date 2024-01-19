<script setup lang="ts">
import { ref, computed } from "vue";
import type { Plugin } from "../plugins";
import { loadPlugins } from "../plugins";
import GitHubIcon from "./GitHubIcon.vue";
import Loading from "./Loading.vue";

const plugins = ref<Record<string, Plugin>>({});
const dialogRef = ref<HTMLDialogElement>();
const loading = ref<InstanceType<typeof Loading> | null>(null);
const selectPlugins = ref<string[]>([]);
const packageJson = ref({});
const availablePlugins = computed(() => {
  return Object.values(plugins.value).filter(
    (p) => !p.hasInstalled(packageJson.value),
  );
});

const emit = defineEmits<(type: "select", plugins: Plugin[]) => void>();

defineExpose({
  open,
});

async function open(packageJsonText: string) {
  loading.value?.open();
  try {
    plugins.value = await loadPlugins();
    packageJson.value = packageJsonText ? JSON.parse(packageJsonText) : {};
    dialogRef.value?.showModal();
  } finally {
    loading.value?.close();
  }
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
  <dialog ref="dialogRef" @click="handleClickDialog" class="ep-select-plugin">
    <div @click.stop class="ep-select-plugin__list">
      <template v-if="availablePlugins.length">
        <div
          v-for="plugin in availablePlugins"
          :key="plugin.name"
          class="ep-select-plugin__item"
        >
          <label class="ep-select-plugin__item-meta">
            <input
              type="checkbox"
              v-model="selectPlugins"
              :value="plugin.name"
            />
            <div class="ep-select-plugin__item-title">{{ plugin.name }}</div>
            <template v-if="plugin.description">
              <div>
                {{ plugin.description }}
              </div>
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
  <Loading ref="loading" />
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

.github {
  display: flex;
}
</style>
