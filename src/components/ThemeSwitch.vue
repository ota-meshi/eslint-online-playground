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
  document.documentElement.classList.toggle("dark");
  const theme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  localStorage.setItem("theme", theme);
  themeValue.value = theme;
}
</script>

<template>
  <button class="ep-theme-switch" @click="switchTheme">
    <div class="ep-theme-switch__icon">
      <div class="ep-theme-switch__sun">☀</div>
      <div class="ep-theme-switch__moon">🌙</div>
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
  transition: border-color 0.25s;
  padding: 1px;
}

.ep-theme-switch__icon {
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
  transition: left 0.25s;
}

.ep-theme-switch__sun {
  color: orange;
  display: block;
}

.ep-theme-switch__moon {
  color: orange;
  display: none;
}

.dark .ep-theme-switch__icon {
  left: 18px;
}

.dark .ep-theme-switch__sun {
  display: none;
}
.dark .ep-theme-switch__moon {
  display: block;
}
</style>
