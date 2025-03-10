<script setup lang="ts">
import type { editor, languages } from "monaco-editor";
import { computed, ref } from "vue";
import { loadMonaco } from "../monaco-editor";
import type { Monaco } from "../monaco-editor";
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
  disableFix?: boolean;
}>();
const emit =
  defineEmits<
    (type: "update:code" | "update:fileName", value: string) => void
  >();
const fileNameInput = ref<HTMLInputElement>();
const monacoEditor = ref<InstanceType<typeof MonacoEditor> | null>(null);
const showPreview = ref(false);
const monaco = ref<Monaco | null>(null);
void loadMonaco().then((value) => {
  monaco.value = value;
});
const language = computed(() => {
  return getLang(monaco.value, props.fileName);
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
  async getQuickFixesFromMarker(
    marker: editor.IMarkerData,
  ): Promise<languages.CodeActionList> {
    return (
      (await monacoEditor.value?.getQuickFixesFromMarker(marker)) ?? {
        actions: [],
        dispose: () => {
          // noop
        },
      }
    );
  },
  runCodeAction(codeAction: languages.CodeAction) {
    return monacoEditor.value?.runCodeAction(codeAction);
  },
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
        :style="{ width: fileName.length + 1 + 'ch' }"
        @keydown.enter="handleFileNameInput"
        @blur="handleFileNameInput"
    /></label>
    <MonacoEditor
      ref="monacoEditor"
      class="ep-code__monaco"
      :model-value="code"
      :language="language"
      :diff="showPreview"
      :right-value="rightCode"
      :markers="markers"
      :right-markers="rightMarkers"
      :code-action-provider="codeActionProvider"
      @update:model-value="handleUpdateModelValue"
    />
    <div v-if="!props.disableFix" class="ep-code__tools">
      <label class="ep-button">
        <input v-model="showPreview" type="checkbox" />
        Preview
      </label>
      <button
        class="ep-button"
        :disabled="rightCode == null || rightCode === code"
        @click="applyFix"
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
  color: var(--ep-input-color);
  background-color: var(--ep-input-background-color);
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
