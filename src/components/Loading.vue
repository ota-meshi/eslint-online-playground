<script setup lang="ts">
import { ref } from "vue";

const dialogRef = ref<HTMLDialogElement>();

defineExpose({
  open,
  close,
});

function open() {
  dialogRef.value?.showModal();
}

function close() {
  dialogRef.value?.close();
}
</script>

<template>
  <dialog ref="dialogRef" class="ep-loading" @cancel.prevent>
    <div class="loader"></div>
  </dialog>
</template>

<style scoped>
.ep-loading {
  padding: 0;
  border: none;
  background-color: transparent;
  overflow: visible;
}

/* Copied from https://css-loaders.com/spinner/ */
.loader {
  width: 50px;
  aspect-ratio: 1;
  display: grid;
  border: 4px solid #0000;
  border-radius: 50%;
  border-right-color: #25b09b;
  animation: l15 1s infinite linear;
}
.loader::before,
.loader::after {
  content: "";
  grid-area: 1/1;
  margin: 2px;
  border: inherit;
  border-radius: 50%;
  animation: l15 2s infinite;
}
.loader::after {
  margin: 8px;
  animation-duration: 3s;
}
@keyframes l15 {
  100% {
    transform: rotate(1turn);
  }
}
</style>
