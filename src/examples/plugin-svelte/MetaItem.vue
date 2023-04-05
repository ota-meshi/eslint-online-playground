<script lang="ts">
export const name = "eslint-plugin-svelte";
</script>
<script setup lang="ts">
const pluginName = name;
</script>
<template>
  <div>
    Example to try
    <a :href="'https://github.com/sveltejs/' + pluginName" target="_blank">{{
      pluginName
    }}</a
    >.
  </div>
</template>
