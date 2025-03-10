<script setup lang="ts">
import type { Linter } from "eslint";
import ansiRegex from "ansi-regex";
import { computed } from "vue";
import type { LinterServiceResult } from "../linter-service";

const props = defineProps<{
  result?: LinterServiceResult | null;
}>();
const emit = defineEmits<{
  (type: "clickMessage", message: Linter.LintMessage): void;
  (
    type: "contextmenuMessage",
    payload: { message: Linter.LintMessage; event: MouseEvent },
  ): void;
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
        0,
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
  <ul class="ep-warnings ep-output-panel">
    <template v-if="result">
      <template v-if="result.returnCode === 0">
        <li v-for="(msg, i) in sortedMessage" :key="i" class="ep-warning__item">
          <span
            :class="`ep-warning__severity-${
              msg.severity === 1 ? 'warning' : 'error'
            }`"
          >
            {{ msg.severity === 1 ? "⚠️" : "✕" }}
          </span>
          <span
            class="ep-warning__message"
            @click="() => emit('clickMessage', msg)"
            @contextmenu="
              (event: MouseEvent) =>
                emit('contextmenuMessage', { message: msg, event })
            "
          >
            {{ msg.message.trim() }}
          </span>
          <template v-if="msg.url">
            <a :href="msg.url" target="_blank" class="ep-warning__rule-id"
              >({{ msg.ruleId }})</a
            >
          </template>
          <template v-else-if="msg.ruleId">
            <span
              class="ep-warning__rule-id"
              @click="() => emit('clickMessage', msg)"
              @contextmenu="
                (event: MouseEvent) =>
                  emit('contextmenuMessage', { message: msg, event })
              "
              >({{ msg.ruleId }})</span
            >
          </template>
          <template v-if="msg.line != null">
            <span
              class="ep-warning__line-numbers"
              @click="() => emit('clickMessage', msg)"
              @contextmenu="
                (event: MouseEvent) =>
                  emit('contextmenuMessage', { message: msg, event })
              "
            >
              [{{ formatPosition(msg) }}]</span
            >
          </template>
        </li>
      </template>
      <template v-else>
        <li>{{ result.result.replace(ansiRegex(), "") }}</li>
      </template>
    </template>
  </ul>
</template>

<style scoped>
.ep-warnings {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  list-style: none;
  margin-block: 0;
  white-space: inherit;
}

.ep-warning__item {
  display: flex;
  gap: 0.5rem;
}

.ep-warning__severity-error,
.ep-warning__severity-warning {
  color: var(--ep-severity-color);
  flex-basis: 1rem;
  font-size: 0.6875rem;
  text-align: center;
  text-transform: uppercase;
  border-radius: 4px;
  flex-shrink: 0;
  align-self: flex-start;
}

.ep-warning__severity-error {
  background-color: var(--ep-severity-error-background-color);
}

.ep-warning__severity-warning {
  background-color: var(--ep-severity-warning-background-color);
}

.ep-warning__message {
  cursor: pointer;
}

.ep-warning__rule-id:not(a) {
  cursor: pointer;
}

.ep-warning__line-numbers {
  cursor: pointer;
}

.ep-warning__line-numbers:hover {
  background-color: var(--ep-warning-item-hover-background-color);
}
</style>
