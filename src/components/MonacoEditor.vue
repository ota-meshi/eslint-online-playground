<script setup lang="ts">
import type { editor, languages } from "monaco-editor";
import { ref, watch } from "vue";
import type {
  CodeActionProvider,
  MonacoDiffEditor,
  MonacoEditor,
} from "../monaco-editor/monaco-setup.js";
import { setupMonacoEditor } from "../monaco-editor/monaco-setup.js";
import type { Language } from "./lang";
import { themeValue } from "./ThemeSwitch.vue";

const props = defineProps<{
  modelValue?: string;
  language?: Language;
  diff?: boolean;
  rightValue?: string;
  markers?: editor.IMarkerData[];
  rightMarkers?: editor.IMarkerData[];
  codeActionProvider?: CodeActionProvider;
}>();
const emit =
  defineEmits<(type: "update:modelValue", modelValue: string) => void>();

const root = ref<HTMLDivElement>();
const editorRef = ref<MonacoEditor | MonacoDiffEditor>();
watch([root, () => props.diff], async ([element, useDiffEditor]) => {
  if (!element) {
    return;
  }
  if (editorRef.value) {
    editorRef.value.disposeEditor();
    editorRef.value = undefined;
  }
  // eslint-disable-next-line require-atomic-updates -- OK
  editorRef.value = await setupMonacoEditor({
    element,
    init: {
      value: props.modelValue ?? "",
      language: props.language ?? "javascript",
      theme: themeValue.value,
    },
    useDiffEditor,
    listeners: {
      onChangeValue(value) {
        emit("update:modelValue", value);
      },
    },
  });

  if (editorRef.value.type === "standalone") {
    editorRef.value.setMarkers(props.markers || []);
  } else {
    editorRef.value.setLeftMarkers(props.markers || []);
    editorRef.value.setRightValue(props.rightValue || "");
    editorRef.value.setRightMarkers(props.rightMarkers || []);
  }
  if (props.codeActionProvider) {
    editorRef.value.setCodeActionProvider(props.codeActionProvider);
  }
});

watch(themeValue, (theme) => {
  editorRef.value?.setTheme(theme);
});
watch(
  () => props.modelValue,
  (value) => {
    if (!editorRef.value) {
      return;
    }
    if (editorRef.value.type === "standalone") {
      editorRef.value.setValue(value || "");
    } else {
      editorRef.value.setLeftValue(value || "");
    }
  },
);
watch(
  () => props.language,
  (value) => {
    if (!editorRef.value) {
      return;
    }
    editorRef.value.setModelLanguage(value || "");
  },
);
watch(
  () => props.markers,
  (markers) => {
    if (!editorRef.value) {
      return;
    }
    if (editorRef.value.type === "standalone") {
      editorRef.value.setMarkers(markers || []);
    } else {
      editorRef.value.setLeftMarkers(markers || []);
    }
  },
);
watch(
  () => props.rightValue,
  (rightValue) => {
    if (editorRef.value?.type === "diff") {
      editorRef.value.setRightValue(rightValue || "");
    }
  },
);
watch(
  () => props.rightMarkers,
  (rightMarkers) => {
    if (editorRef.value?.type === "diff") {
      editorRef.value.setRightMarkers(rightMarkers || []);
    }
  },
);
watch(
  () => props.codeActionProvider,
  (codeActionProvider) => {
    if (codeActionProvider)
      editorRef.value?.setCodeActionProvider(codeActionProvider);
  },
);

function setSelection(selection: {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}) {
  if (editorRef.value?.type === "standalone") {
    editorRef.value?.getEditor().setSelection(selection);
  } else {
    editorRef.value?.getLeftEditor().setSelection(selection);
  }
}

function revealLineInCenter(lineNumber: number) {
  if (editorRef.value?.type === "standalone") {
    editorRef.value?.getEditor().revealLineInCenter(lineNumber);
  } else {
    editorRef.value?.getLeftEditor().revealLineInCenter(lineNumber);
  }
}

function runCodeAction(codeAction: languages.CodeAction) {
  if (!codeAction.edit) {
    return;
  }

  let editorInstance;
  if (editorRef.value?.type === "standalone") {
    editorInstance = editorRef.value?.getEditor();
  } else {
    editorInstance = editorRef.value?.getLeftEditor();
  }
  if (!editorInstance) {
    return;
  }
  const model = editorInstance?.getModel();
  if (!model) {
    return;
  }
  const uri = model.uri.toString();
  const modelVersion = model.getVersionId();

  const operations: editor.ISingleEditOperation[] = [];
  for (const edit of codeAction.edit.edits) {
    if (!("resource" in edit)) {
      return;
    }
    if (edit.resource.toString() !== uri || modelVersion !== edit.versionId) {
      return;
    }
    operations.push(edit.textEdit);
  }
  editorInstance.executeEdits("apply-code-action", operations);
}

defineExpose({
  setSelection,
  revealLineInCenter,
  async getQuickFixesFromMarker(
    marker: editor.IMarkerData,
  ): Promise<languages.CodeActionList> {
    return (
      (await editorRef.value?.getQuickFixesFromMarker(marker)) ?? {
        actions: [],
        dispose: () => {
          // noop
        },
      }
    );
  },
  runCodeAction,
});
</script>

<template>
  <div ref="root" class="ep-monaco"></div>
</template>
