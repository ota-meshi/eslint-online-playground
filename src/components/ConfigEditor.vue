<script setup lang="ts">
import MonacoEditor from "./MonacoEditor.vue";
defineProps<{
  config: string;
}>();
const emit = defineEmits<(type: "update:config", config: string) => void>();

function handleUpdateModelValue(config: string) {
  emit("update:config", config);
}
</script>

<template>
  <div class="ep-config">
    <label>› .eslintrc.json </label>
    <MonacoEditor
      class="ep-config-monaco"
      :model-value="config"
      language="json"
      :diff="false"
      @update:model-value="handleUpdateModelValue"
    />
  </div>
</template>
