<script setup lang="ts">
import type { editor } from "monaco-editor";
import { computed, ref } from "vue";
import type { CodeActionProvider } from "../monaco-editor/monaco-setup";
import MonacoEditor from "./MonacoEditor.vue";
import { getLang } from "./lang";
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
const language = computed(() => {
  return getLang(props.fileName);
});

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
        class="ep-code__file-name"
        :value="fileName"
        @keydown.enter="handleFileNameInput"
        @blur="handleFileNameInput"
        :style="{ width: fileName.length + 1 + 'ch' }"
    /></label>
    <MonacoEditor
      class="ep-code__monaco"
      ref="monacoEditor"
      :model-value="code"
      :language="language"
      :diff="showPreview"
      :right-value="rightCode"
      :markers="markers"
      :right-markers="rightMarkers"
      :code-action-provider="codeActionProvider"
      @update:model-value="handleUpdateModelValue"
    />
    <div class="ep-code__tools">
      <label class="ep-button">
        <input type="checkbox" v-model="showPreview" />
        Preview
      </label>
      <button
        class="ep-button"
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
.ep-code__file-name {
  border: 1px solid var(--ep-border-color);
  border-radius: 2px;
}

.ep-code__tools {
  position: absolute;
  bottom: 16px;
  right: 48px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}
</style>
