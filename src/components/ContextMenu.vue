<script setup lang="ts">
import type { languages } from "monaco-editor";
import { computed, ref } from "vue";
const props = defineProps<{
  codeActionList?: languages.CodeActionList;
}>();
const emit =
  defineEmits<(type: "clickAction", payload: languages.CodeAction) => void>();

const root = ref<HTMLElement | null>(null);

const isEmpty = computed(() => {
  return (
    props.codeActionList == null || props.codeActionList.actions.length === 0
  );
});

function open({ x, y }: { x: number; y: number }) {
  const rootElement = root.value;
  if (!rootElement) {
    return;
  }
  rootElement.style.left = `${x}px`;
  rootElement.style.top = `${y}px`;
  rootElement.showPopover();
}

defineExpose({
  open,
});

window.addEventListener("click", () => {
  const rootElement = root.value;
  if (!rootElement) {
    return;
  }
  rootElement.hidePopover();
});
</script>

<template>
  <ul
    ref="root"
    class="ep-contextmenu"
    popover="manual"
    :class="{ 'ep-contextmenu--empty': isEmpty }"
  >
    <li
      v-for="(action, i) in props.codeActionList?.actions"
      :key="i"
      class="ep-action-menu-item"
      @click="() => emit('clickAction', action)"
    >
      <span>{{ action.title }}</span>
    </li>
  </ul>
</template>

<style scoped>
.ep-contextmenu {
  margin: 0;
  background-color: var(--ep-menu-background-color);
  color: var(--ep-color);
  border: 1px solid var(--ep-border-color);
  border-radius: 2px;
}

.ep-contextmenu--empty {
  display: none;
}

.ep-action-menu-item {
  cursor: pointer;
}
</style>
