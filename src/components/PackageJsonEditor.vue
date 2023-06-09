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
  <div class="ep-package-json ep-input-panel">
    <label>› package.json</label>
    <MonacoEditor
      class="ep-package-json__monaco"
      :model-value="packageJson"
      language="json"
      :diff="false"
      @update:model-value="handleUpdateModelValue"
    />
    <div class="ep-package-json__installed">
      <label>Installed:</label>
      <ul class="ep-package-json__versions">
        <template v-for="pkg in installedPackages" :key="pkg.name">
          <li class="ep-package-json__item">
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

<style scoped>
.ep-package-json {
  display: grid;
  grid:
    "package-json-label package-json-label" min-content
    "package-json-monaco package-json-installed" 1fr
    / 1fr 1fr;
}

.ep-package-json > label {
  grid-area: package-json-label;
}

.ep-package-json__monaco {
  grid-area: package-json-monaco;
}

.ep-package-json__installed {
  grid-area: package-json-installed;
  padding-inline: 0.5rem;
}

.ep-package-json__versions {
  list-style: none;
  margin-block: 0;
  padding-inline-start: 0;
}
</style>
