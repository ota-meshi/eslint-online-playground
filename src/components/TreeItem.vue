<script setup lang="ts">
import { computed } from "vue";
import type { TreeNode } from "./TreeTabs.vue";
import type { Tab } from "./tabs";

const props = defineProps<{
  node: TreeNode;
  level?: number;
}>();
const normalizeLevel = computed(() => props.level || 0);

defineSlots<{
  default(props: { level: number; tab: Tab }): unknown;
}>();
</script>

<template>
  <div v-if="!node.tab" class="tree-item__parent">
    <label
      :style="{ 'padding-inline-start': normalizeLevel + 1 + 'rem' }"
      class="tree-item__parent-label"
      >{{ node.name }}</label
    >
    <div class="tree-item__nest">
      <template v-for="n in node.children" :key="n.name">
        <TreeItem v-slot="params" :node="n" :level="normalizeLevel + 1">
          <slot :level="params.level" :tab="params.tab" />
        </TreeItem>
      </template>
    </div>
  </div>
  <template v-else><slot :level="normalizeLevel" :tab="node.tab" /></template>
</template>

<style scoped>
.tree-item__parent {
  display: flex;
  flex-direction: column;
}
.tree-item__parent label {
  color: var(--ep-inactive-color);
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  padding-block: 0.5rem;
  padding-inline: 1rem;
  position: relative;
}

.tree-item__parent-label::before {
  content: "";
  position: absolute;
  transform: translateX(-0.8rem);
  --un-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='currentColor' d='m24 12l-8 10l-8-10z'/%3E%3C/svg%3E");
  -webkit-mask: var(--un-icon) no-repeat;
  mask: var(--un-icon) no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  background-color: currentColor;
  color: inherit;
  width: 1em;
  height: 1em;
}
</style>
