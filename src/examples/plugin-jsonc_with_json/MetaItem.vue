<script lang="ts">
const jsonc = "eslint-plugin-jsonc";
const json = "@eslint/json";
export const name = `${jsonc} with ${json}`;
</script>
<script setup lang="ts">
const pluginName = jsonc;
</script>
<template>
  <div>
    Example of using
    <a
      href="https://ota-meshi.github.io/eslint-plugin-jsonc/"
      target="_blank"
      >{{ pluginName }}</a
    >
    and
    <a href="https://github.com/eslint/json" target="_blank">{{ json }}</a>
    together.
  </div>
</template>
