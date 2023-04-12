<script lang="ts">
import { ref } from "vue";

export const themeValue = ref<"dark" | "light">(
  (localStorage.getItem("theme") as never) ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light")
);
</script>

<script setup lang="ts">
function switchTheme() {
  themeValue.value = themeValue.value === "dark" ? "light" : "dark";
  document.documentElement.classList.toggle(
    "dark",
    themeValue.value === "dark"
  );
  localStorage.setItem("theme", themeValue.value);
}
</script>

<template>
  <button class="ep-theme-switch" @click="switchTheme">
    <div class="ep-theme-switch__icon"></div>
  </button>
</template>

<style scoped>
.ep-theme-switch {
  position: relative;
  border-radius: 11px;
  display: flex;
  width: 40px;
  height: 22px;
  border: 1px solid var(--ep-border-color);
  background-color: var(--ep-background-color);
  padding: 1px;
  cursor: pointer;

  --ep-theme-switch-animation-duration: 300ms;
}

.ep-theme-switch__icon {
  height: 18px;
  width: 18px;
  border: 1px solid var(--ep-border-color);
  padding: 2px;
  box-sizing: border-box;
  border-radius: 9px;
  display: flex;
  /* for move */
  position: absolute;
  transition: left var(--ep-theme-switch-animation-duration);
  left: 2px;
}
.dark .ep-theme-switch__icon {
  left: 18px;
}

.ep-theme-switch__icon:before {
  content: "";
  display: block;
  margin: auto;
  box-sizing: border-box;
  border-radius: 50%;
  transition: all var(--ep-theme-switch-animation-duration);

  /* sun */
  height: 8px;
  width: 8px;
  box-shadow: 12px -12px 0 0 orange inset;
}
.ep-theme-switch__icon:after {
  content: "";
  display: block;
  box-sizing: border-box;
  height: 2px;
  width: 2px;
  position: absolute;
  left: calc(50% - 1px);
  top: calc(50% - 1px);
  transition: all var(--ep-theme-switch-animation-duration);

  /* sun */
  opacity: 1;
  box-shadow: 0 -5.5px 0 0 gold, -4px -4px 0 0 orange, -5.5px 0 0 0 gold,
    -4px 4px 0 0 orange, 0 5.5px 0 0 gold, 4px 4px 0 0 orange, 5.5px 0 0 0 gold,
    4px -4px 0 0 orange;
  transform: rotate(45deg);
}

.dark .ep-theme-switch__icon:before {
  /* moon */
  height: 12px;
  width: 12px;
  box-shadow: 4px -3px 0 0 yellow inset;
}
.dark .ep-theme-switch__icon:after {
  opacity: 0;
  transform: rotate(135deg) scale(0.5);
}
</style>
