<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import "xterm/css/xterm.css";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";

const element = ref<HTMLDivElement>();
const termBuffer: (() => void)[] = [];
let term: Terminal | null = null;

watch(element, (el) => {
  if (!el) return;

  term = new Terminal({
    fontSize: 12,
  });

  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  term.open(el);
  fitAddon.fit();
  for (const fn of termBuffer) {
    fn();
  }

  const resizeObserver = new ResizeObserver(() => {
    if (el.clientWidth) fitAddon.fit();
  });
  resizeObserver.observe(el);
});

function appendLine(string: string) {
  if (term) {
    term.writeln(string);
  } else {
    termBuffer.push(() => appendLine(string));
  }
}

function append(string: string) {
  if (term) {
    term.write(string);
  } else {
    termBuffer.push(() => append(string));
  }

  void nextTick().then(() => {
    if (element.value) {
      element.value.scrollTop = element.value.scrollHeight;
    }
  });
}

function clear() {
  term?.clear();
  termBuffer.length = 0;
}

defineExpose({ appendLine, append, clear });
</script>

<template>
  <div class="ep-console ep-output-panel">
    <div ref="element" class="ep-xterm-wrapper"></div>
  </div>
</template>

<style scoped>
.ep-xterm-wrapper {
  position: relative;
  height: 100%;
  overflow: hidden;
}
</style>
