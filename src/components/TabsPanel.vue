<script setup lang="ts">
import type { Ref } from "vue";
import { provide, ref, watch } from "vue";
import type { Tab } from "./tabs";
import { sortTabs, getUniqueName } from "./tabs";
defineOptions({ inheritAttrs: false });
defineProps<{
  contentTopShadow?: boolean;
}>();
const name = getUniqueName();

const tabs = ref<Ref<Tab>[]>([]);
const radios: Record<string, HTMLInputElement> = {};
const activeName = ref<string>("");

watch(activeName, (name) => {
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

function setChecked(name: string) {
  activeName.value = name;
}

defineExpose({ setChecked });
</script>

<template>
  <div class="ep-tabs">
    <template v-for="tab in tabs" :key="tab.value.name">
      <label :data-key="tab.value.name">
        <input
          :ref="
            (el: unknown) => (radios[tab.value.name] = el as HTMLInputElement)
          "
          v-model="activeName"
          type="radio"
          :name="name"
          class="ep-tab__label"
          :value="tab.value.name"
          :data-radio-name="tab.value.name"
        />{{ tab.value.title }}
      </label>
    </template>
  </div>
  <div class="ep-tab__panels" :class="[$attrs.class]">
    <slot />
  </div>
</template>

<style scoped>
.ep-tabs {
  background-color: var(--ep-background-color);
  border-block-start: 1px solid var(--ep-border-color);
  display: flex;
  gap: 1px;
  box-sizing: border-box;
}

.ep-tabs label {
  color: var(--ep-inactive-color);
  cursor: pointer;
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  padding-block: 0.5rem;
  padding-inline: 1rem;
  text-transform: uppercase;
}
.ep-tabs input[type="radio"] {
  inline-size: 0;
  margin: 0;
  opacity: 0;
}
.ep-tabs label:has(input[type="radio"]:checked) {
  text-decoration: underline;
  text-underline-offset: 0.45em;
  color: var(--ep-color);
}

.ep-tabs label:has(input[type="radio"]:focus, input[type="radio"]:hover) {
  color: var(--ep-color);
}
.ep-tab__panels {
  height: 100%;
  background-color: var(--ep-background-color);
}
.ep-tab__panels > :deep(*) {
  min-width: 0;
}
</style>
