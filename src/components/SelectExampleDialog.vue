<script setup lang="ts">
import { markRaw, ref, useTemplateRef } from "vue";
import type { Example } from "../examples";
import { loadExamples } from "../examples";
import { loadingWith } from "../utils/loading";
import {
  loadFilesFromGitHub,
  parseGitHubURL,
} from "../utils/load-files/from-github";
import { loadFilesFromZip } from "../utils/load-files/from-zip";

const examples = ref<Record<string, Example>>();
const dialogRef = useTemplateRef("dialogRef");
const inputRepoDialogRef = useTemplateRef("inputRepoDialogRef");
const repoRef = ref<string>("https://github.com/<owner>/<repo>");

const emit =
  defineEmits<(type: "select", files: Record<string, string>) => void>();

defineExpose({
  open,
});

async function open() {
  await loadingWith(async () => {
    examples.value = markRaw(await loadExamples());
    dialogRef.value?.showModal();
  });
}

async function handleClickExample(example: Example) {
  dialogRef.value?.close();
  emit("select", await example.getFiles());
}

function handleClickDialog() {
  dialogRef.value?.close();
}

function handleClickInputDialog() {
  inputRepoDialogRef.value?.close();
}

function handleClickInputRepo() {
  inputRepoDialogRef.value?.showModal();
}

async function handleClickRepo() {
  inputRepoDialogRef.value?.close();
  const github = parseGitHubURL(repoRef.value);
  if (!github) {
    // eslint-disable-next-line no-alert -- message
    alert("Failed to parse GitHub Repo URL");
    return;
  }
  if (github.owner === "<owner>" || github.owner === "<repo>") {
    // eslint-disable-next-line no-alert -- message
    alert("Please enter the URL of your GitHub Repo");
    return;
  }
  const files = await loadFilesFromGitHub(
    github.owner,
    github.repo,
    github.path,
    github.ref,
  );
  dialogRef.value?.close();
  emit("select", files);
}

async function handleClickOpenZip() {
  const pickerOpts = {
    types: [
      {
        description: "Zip files",
        accept: {
          "application/zip": [".zip"],
        },
      },
    ],
    excludeAcceptAllOption: true,
    multiple: false,
  };
  const [fileHandle]: FileSystemFileHandle[] =
    // @ts-expect-error -- ignore
    await window.showOpenFilePicker(pickerOpts);
  const file = await fileHandle.getFile();
  const files = await loadFilesFromZip(file);
  dialogRef.value?.close();
  emit("select", files);
}
</script>

<template>
  <dialog
    ref="inputRepoDialogRef"
    class="ep-select-example__input-repo-dialog"
    @click="handleClickInputDialog"
  >
    <div class="ep-select-example__list" @click.stop>
      <div class="ep-select-example__repo-item">
        <div class="ep-select-example__item-title">Your Repo</div>
        <div class="ep-select-example__repo-form">
          <input v-model="repoRef" />
          <button class="ep-button" @click="handleClickRepo">OK</button>
        </div>
      </div>
    </div>
  </dialog>

  <dialog ref="dialogRef" class="ep-select-example" @click="handleClickDialog">
    <div class="ep-select-example__list" @click.stop>
      <div class="ep-select-example__import">
        <button class="ep-button" @click="handleClickInputRepo">
          Import Your Repo
        </button>
        <button class="ep-button" @click="handleClickOpenZip">
          Import From Zip
        </button>
      </div>
      <div
        v-for="example in examples"
        :key="example.name"
        class="ep-select-example__item"
        @click="
          (e: MouseEvent) => {
            (e.target as HTMLElement).tagName !== 'A' &&
              handleClickExample(example);
          }
        "
      >
        <div class="ep-select-example__item-title">{{ example.name }}</div>
        <template v-if="example.description">
          <Component
            :is="
              typeof example.description === 'string'
                ? 'div'
                : example.description
            "
          >
            {{ example.description }}
          </Component>
        </template>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.ep-select-example,
.ep-select-example__input-repo-dialog {
  color: var(--ep-color);
  background-color: var(--ep-dialog-background-color);
  border: 1px solid var(--ep-border-color);
  border-radius: 2px;
  font-size: 0.75rem;
  box-sizing: border-box;
  padding: 0;
}
.ep-select-example__input-repo-dialog {
  min-width: 360px;
}

.ep-select-example :deep(a),
.ep-select-example__input-repo-dialog :deep(a) {
  color: var(--ep-link-color);
  text-decoration: none;
}
.ep-select-example :deep(a:hover),
.ep-select-example__input-repo-dialog :deep(a:hover) {
  text-decoration: underline;
}

.ep-select-example__list {
  gap: 8px;
  display: flex;
  flex-direction: column;
  padding: 1em;
}

.ep-select-example__import {
  border-bottom: 1px solid var(--ep-border-color);
  padding: 8px 4px 4px;
  display: flex;
  gap: 4px;
}

.ep-select-example__item {
  cursor: pointer;
  display: flex;
  gap: 16px;
}
.ep-select-example__item:has(+ .ep-select-example__item) {
  border-bottom: 1px solid var(--ep-border-color);
}

.ep-select-example__item-title {
  font-weight: bold;
}

.ep-select-example__repo-form {
  padding: 4px;
}

.ep-select-example__repo-form > input {
  width: 100%;
  display: block;
  box-sizing: border-box;
}

.ep-select-example__import > button,
.ep-select-example__repo-form > button {
  padding-block: 0.1rem;
  padding-inline: 0.3rem;
}
</style>
