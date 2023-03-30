<script lang="ts">
export type PackageJsonData = {
  name: string;
  version: string;
  homepage?: string;
};
</script>
<script setup lang="ts">
import MonacoEditor from "./MonacoEditor.vue";
defineProps<{
  packageJson: string;
  installedPackages: PackageJsonData[];
}>();
const emit =
  defineEmits<(type: "update:packageJson", packageJson: string) => void>();

function handleUpdateModelValue(packageJson: string) {
  emit("update:packageJson", packageJson);
}
</script>

<template>
  <div class="ep-package-json">
    <label>› package.json</label>
    <MonacoEditor
      class="ep-package-json-monaco"
      :model-value="packageJson"
      language="json"
      :diff="false"
      @update:model-value="handleUpdateModelValue"
    />
    <div class="ep-package-json-installed">
      <label>Installed:</label>
      <ul class="ep-package-json-versions">
        <template v-for="pkg in installedPackages" :key="pkg.name">
          <li class="ep-package-json-item">
            <a
              :href="
                pkg.homepage || `https://www.npmjs.com/package/${pkg.name}`
              "
              target="_blank"
              >{{ pkg.name }}</a
            >@{{ pkg.version }}
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>
