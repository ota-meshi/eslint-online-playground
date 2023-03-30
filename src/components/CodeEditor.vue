<script setup lang="ts">
import type { editor } from "monaco-editor";
import { ref } from "vue";
import type { CodeActionProvider } from "../monaco-editor/monaco-setup";
import MonacoEditor from "./MonacoEditor.vue";
defineProps<{
  code: string;
  fileName: string;
  rightCode?: string;
  markers?: editor.IMarkerData[];
  rightMarkers?: editor.IMarkerData[];
  codeActionProvider?: CodeActionProvider;
}>();
const emit =
  defineEmits<
    (type: "update:code" | "update:fileName", value: string) => void
  >();
const fileNameInput = ref<HTMLInputElement>();

function handleUpdateModelValue(code: string) {
  emit("update:code", code);
}

function handleFileNameInput() {
  emit("update:fileName", fileNameInput.value?.value ?? "");
}
</script>

<template>
  <div class="ep-code">
    <label
      >›
      <input
        ref="fileNameInput"
        type="text"
        class="ep-code-file-name"
        :value="fileName"
        @blur="handleFileNameInput"
    /></label>
    <MonacoEditor
      class="ep-code-monaco"
      :model-value="code"
      language="javascript"
      :diff="false"
      :right-value="rightCode"
      :markers="markers"
      :right-markers="rightMarkers"
      :code-action-provider="codeActionProvider"
      @update:model-value="handleUpdateModelValue"
    />
  </div>
</template>
