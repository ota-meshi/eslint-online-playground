<script lang="ts">
export const name = "eslint-plugin-eslint-plugin";
</script>
<script setup lang="ts">
const pluginName = name;
</script>
<template>
  <div>
    Example to try
    <a
      :href="'https://github.com/eslint-community/' + pluginName"
      target="_blank"
      >{{ pluginName }}</a
    >.
  </div>
</template>
