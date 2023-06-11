<script setup lang="ts">
import { nextTick, ref } from "vue";
import ansiRegex from "ansi-regex";

const CHA = "\u001b[1G";
const EL = "\u001b[K";

let nextEraseInLine = false;

const element = ref<HTMLDivElement>();
const consoleText = ref("");

function appendLine(string: string) {
  const currContent = (consoleText.value = consoleText.value.trimEnd());

  append(`${(currContent ? "\n" : "") + string}\n`);
}

function append(string: string) {
  const ansiRe = ansiRegex();
  let start = 0;

  for (const match of string.matchAll(ansiRe)) {
    if (match[0] === CHA || match[0] === EL) {
      nextEraseInLine = true;
    }

    append(string.slice(start, match.index));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- ok
    start = match.index! + match[0].length;
  }

  append(string.slice(start));

  void nextTick().then(() => {
    if (element.value) {
      element.value.scrollTop = element.value.scrollHeight;
    }
  });

  function append(s: string) {
    const str = s.replace(/\r/g, "");
    if (!str) return;

    if (nextEraseInLine) {
      eraseInLine();

      nextEraseInLine = false;
    }

    consoleText.value += str;
  }

  function eraseInLine() {
    const lastLinefeed = consoleText.value.lastIndexOf("\n");
    if (lastLinefeed > -1)
      consoleText.value = consoleText.value.slice(0, lastLinefeed + 1);
  }
}

function clear() {
  consoleText.value = "";
}

defineExpose({ appendLine, append, clear });
</script>

<template>
  <div ref="element" class="ep-console ep-output-panel">{{ consoleText }}</div>
</template>
