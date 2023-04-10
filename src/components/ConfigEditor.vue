<script setup lang="ts">
import { computed } from "vue";
import { CONFIG_FILE_NAMES } from "../utils/eslint-info";
import type { ConfigFileName } from "../utils/eslint-info";
import MonacoEditor from "./MonacoEditor.vue";
import { getLang } from "./lang";
const props = defineProps<{
  config: string;
  fileName: ConfigFileName;
}>();
const emit = defineEmits<{
  (type: "update:config", value: string): void;
  (type: "update:fileName", value: ConfigFileName): void;
}>();
const computedFileName = computed({
  get() {
    return props.fileName;
  },
  set(fileName: ConfigFileName) {
    emit("update:fileName", fileName);
  },
});
const language = computed(() => {
  return getLang(props.fileName);
});

function handleUpdateModelValue(config: string) {
  emit("update:config", config);
}
</script>

<template>
  <div class="ep-config ep-input-panel">
    <label
      >›
      <select v-model="computedFileName" class="ep-config__file-name">
        <template v-for="value in CONFIG_FILE_NAMES" :key="value">
          <option :value="value">{{ value }}</option>
        </template>
      </select>
    </label>
    <MonacoEditor
      class="ep-config-monaco"
      :model-value="config"
      :language="language"
      :diff="false"
      @update:model-value="handleUpdateModelValue"
    />
  </div>
</template>

<style scoped>
.ep-config__file-name {
  border: 1px solid var(--ep-border-color);
  color: var(--ep-input-color);
  background-color: var(--ep-input-background-color);
  border-radius: 2px;
}
</style>
