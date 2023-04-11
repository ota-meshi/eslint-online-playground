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
    <div class="ep-theme-switch__icon-button">
      <div class="ep-theme-switch__icon"></div>
    </div>
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

.ep-theme-switch__icon-button {
  box-sizing: border-box;
  height: 18px;
  width: 18px;
  border-radius: 9px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--ep-border-color);
  position: absolute;
  left: 2px;
  transition: left var(--ep-theme-switch-animation-duration);
}
.dark .ep-theme-switch__icon-button {
  left: 18px;
}

.ep-theme-switch__icon {
  display: flex;
  height: 12px;
  width: 12px;
  box-sizing: border-box;
}
.ep-theme-switch__icon:before {
  content: "";
  display: block;
  margin: auto;
  box-sizing: border-box;
  border-radius: 50%;
  transition: height var(--ep-theme-switch-animation-duration),
    width var(--ep-theme-switch-animation-duration),
    box-shadow var(--ep-theme-switch-animation-duration);

  /* sun */
  height: 8px;
  width: 8px;
  box-shadow: -12px -12px 0 0 orange inset;
}
.ep-theme-switch__icon:after {
  content: "";
  display: block;
  box-sizing: border-box;
  border-radius: 50%;
  height: 2px;
  width: 2px;
  position: absolute;
  left: calc(50% - 1px);
  top: calc(50% - 1px);
  transition: box-shadow var(--ep-theme-switch-animation-duration),
    opacity var(--ep-theme-switch-animation-duration);

  /* sun */
  opacity: 1;
  box-shadow: 0 -5.5px 0 0 orange, -4px -4px 0 0 orange, -5.5px 0 0 0 orange,
    -4px 4px 0 0 orange, 0 5.5px 0 0 orange, 4px 4px 0 0 orange,
    5.5px 0 0 0 orange, 4px -4px 0 0 orange;
}

.dark .ep-theme-switch__icon:before {
  /* moon */
  height: 12px;
  width: 12px;
  box-shadow: -3px -2px 0 0 yellow inset;
}
.dark .ep-theme-switch__icon:after {
  opacity: 0;
  box-shadow: none;
}
</style>
