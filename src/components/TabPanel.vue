<script setup lang="ts">
import type { Ref } from "vue";
import { inject, onMounted, onUnmounted, ref, computed } from "vue";
import type { Tab } from "./tabs";

const props = defineProps<{
  title: string;
  name: string;
  active?: boolean;
  order: number;
}>();
const addTab = inject<(tab: Ref<Tab>) => void>("addTab");
const removeTab = inject<(tab: Tab) => void>("removeTab");

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
  order: props.order,
}));

onMounted(() => {
  addTab?.(data);
});
onUnmounted(() => {
  removeTab?.(data.value);
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
