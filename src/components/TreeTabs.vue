<script lang="ts">
export type TreeNode = {
  name: string;
  tab: Tab | null;
  children: TreeNode[];
};
</script>
<script setup lang="ts">
import type { Ref } from "vue";
import { provide, ref, watch, computed } from "vue";
import type { Tab } from "./tabs";
import { getUniqueName, sortTabs } from "./tabs";
import TreeItem from "./TreeItem.vue";
const name = getUniqueName();

const tabs = ref<Ref<Tab>[]>([]);
const radios: Record<string, HTMLInputElement> = {};
const activeName = ref<string>("");

const emit = defineEmits<(type: "active" | "remove", name: string) => void>();

watch(activeName, (name) => {
  if (name) {
    emit("active", name);
  }
  for (const tab of tabs.value) {
    tab.value.active = tab.value.name === name;
  }
});

provide("addTab", (tab: Ref<Tab>) => {
  tabs.value.push(tab);
  sortTabs(tabs.value);
  if (tab.value.active || !activeName.value) {
    activeName.value = tab.value.name;
  }
});
provide("removeTab", (tab: Tab) => {
  const i = tabs.value.findIndex((t) => t.value.name === tab.name);
  if (i >= 0) {
    tabs.value.splice(i, 1);
    if (activeName.value === tab.name) {
      activeName.value = tabs.value[0]?.value.name || "";
    }
  }
});

const treeTabs = computed(() => {
  sortTabs(tabs.value);
  const tree: TreeNode = { name: "root", tab: null, children: [] };
  for (const tab of tabs.value) {
    const pathNames = tab.value.title.split(/[/\\]/u);
    let targetTree = tree;
    let leaf = pathNames.pop()!;
    for (const target of pathNames) {
      const targetNode = targetTree.children.find(
        (child) => child.name === target,
      );
      if (targetNode) {
        targetTree = targetNode;
      } else {
        const newNode = { name: target, tab: null, children: [] };
        targetTree.children.push(newNode);
        targetTree = newNode;
      }
    }
    targetTree.children.push({ name: leaf, tab: tab.value, children: [] });
  }
  return tree;
});

function handleRemove(tab: Tab) {
  emit("remove", tab.name);
}

function setChecked(name: string) {
  activeName.value = name;
}

defineExpose({ setChecked });
</script>

<template>
  <div class="ep-tree-tabs">
    <div class="ep-tree-tabs__tools">
      <slot name="tools" />
    </div>
    <div class="ep-tree-tabs__menu">
      <template v-for="node in treeTabs.children" :key="node.name">
        <TreeItem :node="node" v-slot="{ level, tab }">
          <div class="ep-tree-tabs__menu-item">
            <label :style="{ 'padding-inline-start': level + 1 + 'rem' }">
              <input
                :ref="(el) => (radios[tab.name] = el as HTMLInputElement)"
                v-model="activeName"
                type="radio"
                :name="name"
                class="ep-tab-label"
                :value="tab.name"
                :data-radio-name="tab.name"
                @keydown.delete="
                  () => {
                    if (tab.removable) handleRemove(tab);
                  }
                "
              />{{ tab.title.split(/[/\\]/u).pop() }}
            </label>
            <button
              v-if="tab.removable"
              class="ep-tree-tab__remove-button"
              @click="() => handleRemove(tab)"
            >
              -
            </button>
          </div>
        </TreeItem>
      </template>
    </div>
    <div class="ep-tree-tab__panels">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ep-tree-tabs {
  border-block-start: 1px solid var(--ep-border-color);
  height: 100%;
  display: grid;
  grid:
    "tools panels" min-content
    "menu panels" 1fr /
    min-content 1fr;
  box-sizing: border-box;
}

.ep-tree-tabs__tools {
  grid-area: tools;
}

.ep-tree-tabs__menu {
  grid-area: menu;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--ep-menu-background-color);
}

.ep-tree-tabs__menu-item {
  display: flex;
  align-items: center;
}
.ep-tree-tabs__menu label {
  color: var(--ep-inactive-color);
  cursor: pointer;
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  padding-block: 0.5rem;
  padding-inline: 1rem;
  display: flex;
  white-space: nowrap;
}
.ep-tree-tabs__menu input[type="radio"] {
  inline-size: 0;
  margin: 0;
  opacity: 0;
}
.ep-tree-tabs__menu label:has(input[type="radio"]:checked),
.ep-tree-tabs__menu .ep-tree-tabs__menu-item:has(input[type="radio"]:checked) {
  background-color: var(--ep-active-menu-background-color);
  color: var(--ep-color);
}

.ep-tree-tabs__menu
  label:has(input[type="radio"]:focus, input[type="radio"]:hover) {
  color: var(--ep-color);
}

.ep-tree-tab__remove-button {
  font-family: system-ui;

  color: var(--ep-color);
  background-color: transparent;
  cursor: pointer;
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  padding-block: 0.1rem;
  padding-inline: 0.3rem;
  height: 1rem;

  outline: none;
  appearance: none;

  border: 1px solid var(--ep-border-color);
  border-radius: 2px;

  margin-left: auto;

  display: flex;
  align-items: center;
  justify-content: center;
}

.ep-tree-tab__panels {
  grid-area: panels;
  height: 100%;
  background-color: var(--ep-background-color);
  border-left: 1px solid var(--ep-border-color);
}
</style>
