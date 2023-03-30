<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref, Ref, computed } from "vue";
import { Tab } from "./TabsPanel.vue";

const props = defineProps<{
  title: string;
  name: string;
  active?: boolean;
}>();
const addTab: (tab: Ref<Tab>) => void = inject("addTab")!;
const removeTab: (tab: Tab) => void = inject("removeTab")!;

const activeValue = ref(Boolean(props.active));

const data = computed(() => ({
  title: props.title,
  name: props.name,
  get active() {
    return activeValue.value;
  },
  set active(active) {
    activeValue.value = active;
  },
}));

onMounted(() => {
  addTab(data);
});
onUnmounted(() => {
  removeTab(data.value);
});
</script>

<template>
  <div v-show="activeValue" class="ep-tab-panel">
    <slot />
  </div>
</template>

<style scoped>
.ep-tab-panel {
  height: 100%;
}
</style>
