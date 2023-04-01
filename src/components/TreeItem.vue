<script setup lang="ts">
import { computed } from "vue";
import type { TreeNode } from "./TreeTabs.vue";

const props = defineProps<{
  node: TreeNode;
  level?: number;
}>();
const normalizeLevel = computed(() => props.level || 0);
</script>

<template>
  <div v-if="!node.tab" class="tree-item--parent">
    <label
      :style="{ 'padding-inline-start': normalizeLevel + 1 + 'rem' }"
      class="tree-item__parent-label"
      >{{ node.name }}</label
    >
    <div class="tree-item--nest">
      <template v-for="n in node.children">
        <TreeItem :node="n" :level="normalizeLevel + 1" v-slot="{ level, tab }">
          <slot :level="level" :tab="tab" />
        </TreeItem>
      </template>
    </div>
  </div>
  <template v-else><slot :level="normalizeLevel" :tab="node.tab" /></template>
</template>

<style scoped>
.tree-item--parent {
  display: flex;
  flex-direction: column;
}
.tree-item--parent label {
  color: var(--ep-inactive-tab-color);
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  padding-block: 0.5rem;
  padding-inline: 1rem;
}

.tree-item__parent-label::before {
  content: "▾";
  position: absolute;
  transform: translateX(-0.8rem);
}
</style>
