<script setup lang="ts">
import { Linter } from "eslint";
import ansiRegex from "ansi-regex";
import { computed, inject, nextTick, onMounted, onUnmounted, ref } from "vue";
import { LinterServiceResult } from "../linter-service";

const props = defineProps<{
  result?: LinterServiceResult;
}>();
const emit = defineEmits<{
  (type: "clickMessage", message: Linter.LintMessage): void;
}>();
const sortedMessage = computed(() => {
  if (!props.result || props.result.returnCode !== 0) {
    return [];
  }
  const result = props.result;
  return [...result.result.messages]
    .sort(
      (a, b) =>
        a.line - b.line ||
        a.column - b.column ||
        (a.endLine != null && b.endLine != null && a.endLine - b.endLine) ||
        (a.endColumn != null &&
          b.endColumn != null &&
          a.endColumn - b.endColumn) ||
        0
    )
    .map((msg) => {
      return {
        ...msg,
        url: result.ruleMetadata[msg.ruleId || ""]?.docs?.url,
      };
    });
});

function formatPosition(message: Linter.LintMessage) {
  const start = `${message.line}:${message.column}`;
  if (message.endLine == null || message.endColumn == null) {
    return start;
  }
  if (message.endLine === message.line) {
    return `${start}-${message.endColumn}`;
  }
  return `${start}-${message.endLine}:${message.endColumn}`;
}
</script>

<template>
  <ul class="ep-warnings">
    <template v-if="result">
      <template v-if="result.returnCode === 0">
        <li v-for="(msg, i) in sortedMessage" :key="i" class="ep-warning-item">
          <span :class="`ep-severity-${msg.severity}`">
            {{ msg.severity === 1 ? "⚠️" : "❌" }}
          </span>
          <span> {{ msg.message.trim() }} </span>
          <template v-if="msg.url">
            <a :href="msg.url" target="_blank">({{ msg.ruleId }})</a>
          </template>
          <template v-else>({{ msg.ruleId }})</template>
          <span
            class="ep-line-numbers"
            @click="() => emit('clickMessage', msg)"
          >
            [{{ formatPosition(msg) }}]</span
          >
        </li>
      </template>
      <template v-else>
        <li>{{ result.result.replace(ansiRegex(), "") }}</li>
      </template>
    </template>
  </ul>
</template>
