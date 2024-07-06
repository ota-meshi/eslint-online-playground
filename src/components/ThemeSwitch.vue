<script lang="ts">
import { ref } from "vue";

export const themeValue = ref<"dark" | "light">(
  (localStorage.getItem("theme") as never) ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"),
);
</script>

<script setup lang="ts">
import "shine-and-bright/index.css";

function switchTheme() {
  themeValue.value = themeValue.value === "dark" ? "light" : "dark";
  document.documentElement.classList.toggle(
    "dark",
    themeValue.value === "dark",
  );
  localStorage.setItem("theme", themeValue.value);
}
</script>

<template>
  <button
    class="ep-theme-switch snb-shine-and-bright-switch"
    @click="switchTheme"
  >
    <span class="snb-shine-and-bright snb-twinkle-on-hover"></span>
  </button>
</template>

<style scoped>
.ep-theme-switch {
  --snb-switch-border-color: var(--ep-border-color);
}
</style>
