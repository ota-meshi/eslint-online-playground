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
const monacoEditor = ref();

function handleUpdateModelValue(code: string) {
  emit("update:code", code);
}

function handleFileNameInput() {
  let fileName = fileNameInput.value?.value ?? "";
  fileName = fileName.trim();
  fileName = fileName.replace(/[/\\]+/gu, "/");
  fileName = fileName.replace(/^\/|\/$/gu, "");
  if (fileNameInput.value) {
    fileNameInput.value.value = fileName;
  }
  emit("update:fileName", fileName);
}

function setSelection(selection: {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}) {
  monacoEditor.value?.setSelection(selection);
}

function revealLineInCenter(lineNumber: number) {
  monacoEditor.value?.revealLineInCenter(lineNumber);
}

defineExpose({
  setSelection,
  revealLineInCenter,
});
</script>

<template>
  <div class="ep-code ep-input-panel">
    <label
      >›
      <input
        ref="fileNameInput"
        type="text"
        class="ep-code-file-name"
        :value="fileName"
        @keydown.enter="handleFileNameInput"
        @blur="handleFileNameInput"
    /></label>
    <MonacoEditor
      class="ep-code-monaco"
      ref="monacoEditor"
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

<style scoped>
.ep-code-file-name {
  border: 1px solid var(--ep-border-color);
  border-radius: 2px;
}
</style>
