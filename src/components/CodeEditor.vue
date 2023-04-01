<script setup lang="ts">
import type { editor } from "monaco-editor";
import { ref } from "vue";
import type { CodeActionProvider } from "../monaco-editor/monaco-setup";
import MonacoEditor from "./MonacoEditor.vue";
const props = defineProps<{
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
const monacoEditor = ref<InstanceType<typeof MonacoEditor> | null>(null);
const showPreview = ref(false);

function handleUpdateModelValue(code: string) {
  emit("update:code", code);
}

function applyFix() {
  if (props.rightCode != null) emit("update:code", props.rightCode);
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
      :diff="showPreview"
      :right-value="rightCode"
      :markers="markers"
      :right-markers="rightMarkers"
      :code-action-provider="codeActionProvider"
      @update:model-value="handleUpdateModelValue"
    />
    <div class="ep-code-tools">
      <label>
        <input type="checkbox" v-model="showPreview" />
        Preview
      </label>
      <button
        @click="applyFix"
        :disabled="rightCode == null || rightCode === code"
      >
        Apply Fix
      </button>
    </div>
  </div>
</template>

<style scoped>
.ep-code {
  position: relative;
}
.ep-code-file-name {
  border: 1px solid var(--ep-border-color);
  border-radius: 2px;
}

.ep-code-tools {
  position: absolute;
  bottom: 16px;
  right: 48px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}
.ep-code-tools label:has(input[type="checkbox"]),
.ep-code-tools button {
  color: var(--ep-color);
  background-color: var(--ep-background-color);
  cursor: pointer;
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  padding-block: 0.5rem;
  padding-inline: 1rem;

  outline: none;
  appearance: none;

  border: 1px solid var(--ep-border-color);
  border-radius: 2px;

  display: flex;
  align-items: center;
  justify-content: center;
}

.ep-code-tools button[disabled] {
  cursor: initial;
}

.ep-code-tools input[type="checkbox"] {
  inline-size: 0;
  margin: 0;
  opacity: 0;
}
.ep-code-tools label:has(input[type="checkbox"]:not(:checked)),
.ep-code-tools button[disabled] {
  color: var(--ep-inactive-color);
}

.ep-code-tools
  label:has(input[type="checkbox"]:checked, input[type="checkbox"]:hover) {
  color: var(--ep-color);
}
</style>
