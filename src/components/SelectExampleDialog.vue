<script setup lang="ts">
import { markRaw, ref } from "vue";
import type { Example } from "../examples";
import { loadExamples } from "../examples";
import * as loading from "./loading";

const examples = ref<Record<string, Example>>();
const dialogRef = ref<HTMLDialogElement>();

const emit = defineEmits<(type: "select", example: Example) => void>();

defineExpose({
  open,
});

async function open() {
  loading.open();
  try {
    examples.value = markRaw(await loadExamples());
    dialogRef.value?.showModal();
  } finally {
    loading.close();
  }
}

function handleClickExample(example: Example) {
  dialogRef.value?.close();
  emit("select", example);
}

function handleClickDialog() {
  dialogRef.value?.close();
}
</script>

<template>
  <dialog ref="dialogRef" @click="handleClickDialog" class="ep-select-example">
    <div @click.stop class="ep-select-example__list">
      <div
        v-for="example in examples"
        :key="example.name"
        @click="
          (e) => {
            (e.target as HTMLElement).tagName !== 'A' &&
              handleClickExample(example);
          }
        "
        class="ep-select-example__item"
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
.ep-select-example {
  color: var(--ep-color);
  background-color: var(--ep-dialog-background-color);
  border: 1px solid var(--ep-border-color);
  border-radius: 2px;
  font-size: 0.75rem;
}

.ep-select-example :deep(a) {
  color: var(--ep-link-color);
  text-decoration: none;
}
.ep-select-example :deep(a:hover) {
  text-decoration: underline;
}

.ep-select-example__list {
  gap: 8px;
  display: flex;
  flex-direction: column;
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
</style>
