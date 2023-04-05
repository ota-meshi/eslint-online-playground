<script setup lang="ts">
import { ref } from "vue";
import type { Plugin } from "../plugins";
import { loadPlugins } from "../plugins";
import github from "../images/github.svg";

const plugins = ref<Record<string, Plugin>>();
const dialogRef = ref<HTMLDialogElement>();

const emit = defineEmits<(type: "select", plugin: Plugin) => void>();

defineExpose({
  open,
});

async function open() {
  plugins.value = await loadPlugins();
  dialogRef.value?.showModal();
}

function handleClickPlugin(plugin: Plugin) {
  dialogRef.value?.close();
  emit("select", plugin);
}

function handleClickDialog() {
  dialogRef.value?.close();
}
</script>

<template>
  <dialog ref="dialogRef" @click="handleClickDialog" class="ep-select-plugin">
    <div @click.stop class="ep-select-plugin__list">
      <div
        v-for="plugin in plugins"
        :key="plugin.name"
        @click="
          (e) => {
            (e.target as HTMLElement).tagName !== 'A' && handleClickPlugin(plugin);
          }
        "
        class="ep-select-plugin__item"
      >
        <div class="ep-select-plugin__item-title">{{ plugin.name }}</div>
        <template v-if="plugin.description">
          <div>
            {{ plugin.description }}
          </div>
        </template>
        <a
          v-if="plugin.repo"
          class="github"
          target="_blank"
          :href="plugin.repo"
          @click.stop
        >
          <img :src="github" alt="GitHub" />
        </a>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.ep-select-plugin {
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
  cursor: pointer;
  display: flex;
  gap: 16px;
  align-items: center;
}
.ep-select-plugin__item:has(+ .ep-select-plugin__item) {
  border-bottom: 1px solid var(--ep-border-color);
}

.ep-select-plugin__item-title {
  color: var(--ep-link-color);
  font-weight: bold;
}

.github {
  display: block;
  width: 24px;
  height: 24px;
}
</style>
