<script setup lang="ts">
import {
  computed,
  ref,
  shallowRef,
  watch,
  nextTick,
  onMounted,
  reactive,
} from "vue";
import type { editor, IRange, Range, languages } from "monaco-editor";
import CodeEditor from "./CodeEditor.vue";
import ConfigEditor from "./ConfigEditor.vue";
import type { PackageJsonData } from "./PackageJsonEditor.vue";
import PackageJsonEditor from "./PackageJsonEditor.vue";
import ConsoleOutput from "./ConsoleOutput.vue";
import TabsPanel from "./TabsPanel.vue";
import TabPanel from "./TabPanel.vue";
import WarningsPanel from "./WarningsPanel.vue";
import TreeTabs from "./TreeTabs.vue";
import type {
  LinterService,
  LinterServiceResultSuccess,
  LinterServiceResult,
} from "../linter-service";
import { setupLintServer } from "../linter-service";
import type { Linter } from "eslint";
import type { Monaco } from "../monaco-editor";
import { loadMonaco } from "../monaco-editor";
import { isReservedFileName } from "../linter-service/server/eslint-online-playground-server-utils.mjs";
import type { CodeActionProvider } from "../monaco-editor/monaco-setup";
import { debounce } from "../utils/debounce";
import type { ConfigFileName } from "../utils/eslint-info";
import { CONFIG_FILE_NAMES } from "../utils/eslint-info";
import { maybeTSConfig } from "../utils/tsconfig";
import { transformConfigFormat } from "./transform-config";
import {
  disableBuiltinValidate,
  enableBuiltinValidate,
} from "../monaco-editor/monaco-loader";
import NetlifyBadge from "./badges/NetlifyBadge.vue";
import { isLockFile } from "../utils/lock-file";
import { isRepoEnvFile } from "../utils/evn-file";

const props = defineProps<{
  sources: Record<string, string>;
}>();
const emit =
  defineEmits<
    (type: "update:sources", value: Record<string, string>) => void
  >();

let seq = 0;

const consoleOutput = ref<InstanceType<typeof ConsoleOutput> | null>(null);
const outputTabs = ref<InstanceType<typeof TabsPanel> | null>(null);
const inputTabs = ref<InstanceType<typeof TreeTabs> | null>(null);
const lintServerRef = shallowRef<LinterService>();
const monacoRef = shallowRef<Monaco>();
void loadMonaco().then((monaco) => (monacoRef.value = monaco));

const installedPackages = reactive<PackageJsonData[]>([]);

const allSourceDataList = reactive<SourceData[]>([]);
const activeSource = shallowRef<SourceData | null>(null);

const configFileName = computed<ConfigFileName>({
  get: () => {
    return (
      CONFIG_FILE_NAMES.find((name) => props.sources[name]) || ".eslintrc.json"
    );
  },
  set: (value) => {
    const old = configFileName.value;

    void updateConfigFormat();
    void remove();

    async function updateConfigFormat() {
      const configText = await transformConfigFormat(
        props.sources[old],
        old,
        value,
      );
      emitUpdateSources({ configFileName: value, configText });
    }

    async function remove() {
      const lintServer = await getLintServer();
      await lintServer.removeFile(old);
    }
  },
});
const configText = computed({
  get: () => props.sources[configFileName.value] || "{}",
  set: (value) => {
    emitUpdateSources({ configText: value });
  },
});
const packageJson = computed({
  get: () => props.sources["package.json"] || "{}",
  set: (value) => {
    emitUpdateSources({ packageJson: value });
  },
});
const displaySourceDataList = computed(() => {
  const list: SourceData[] = [];
  const envList: SourceData[] = [];
  for (const sourceData of allSourceDataList) {
    if (
      maybeTSConfig(sourceData.fileName) ||
      isLockFile(sourceData.fileName) ||
      isRepoEnvFile(sourceData.fileName)
    ) {
      envList.push(sourceData);
    } else {
      list.push(sourceData);
    }
  }
  return {
    list: list.sort((a, b) => a.fileName.localeCompare(b.fileName)),
    envList: envList.sort((a, b) => a.fileName.localeCompare(b.fileName)),
  };
});
defineExpose({
  selectFile,
  selectOutput,
});
type ResultData = {
  markers?: editor.IMarkerData[];
  fixedCode?: string;
  fixedMarkers?: editor.IMarkerData[];
  messageMap?: Map<string, Linter.LintMessage>;
};

type SourceData = {
  id: number;
  fileName: string;
  code: string;
  linterServiceResult: LinterServiceResult | null;
  resultData: ResultData | null;
  editor?: InstanceType<typeof CodeEditor>;
  provideCodeAction: (
    model: editor.ITextModel,
    _range: Range,
    context: languages.CodeActionContext,
  ) => ReturnType<CodeActionProvider>;
};

watch(
  () => props.sources,
  (newSources, oldSources) => {
    if (newSources === oldSources) {
      return;
    }
    for (const source of [...allSourceDataList]) {
      if (newSources[source.fileName] == null) {
        allSourceDataList.splice(allSourceDataList.indexOf(source), 1);
        void remove(source.fileName);
      }
    }
    for (const [fileName, code] of Object.entries(newSources)) {
      if (
        (CONFIG_FILE_NAMES as readonly string[]).includes(fileName) ||
        fileName === "package.json"
      ) {
        continue;
      }
      void write(fileName, code);
      const sourceData = allSourceDataList.find((d) => d.fileName === fileName);
      if (sourceData) {
        sourceData.code = code;
      } else {
        allSourceDataList.push(createSourceData(fileName, code));
      }
    }
    if (!activeSource.value) {
      activeSource.value = allSourceDataList[0];
    }

    async function remove(filePath: string) {
      const lintServer = lintServerRef.value;
      if (lintServer) await lintServer.removeFile(filePath);
    }

    async function write(filePath: string, code: string) {
      const lintServer = lintServerRef.value;
      if (lintServer) await lintServer.writeFile(filePath, code);
    }
  },
  { immediate: true },
);

function createSourceData(initFileName: string, initCode: string): SourceData {
  const linterServiceResult = ref<LinterServiceResult | null>(null);
  const fileName = ref(initFileName);
  let currFileName = initFileName;
  const code = ref(initCode);

  const resultData = computed<ResultData | null>(() => {
    const monaco = monacoRef.value;
    const result = linterServiceResult.value;

    if (!monaco || !result || result.returnCode !== 0) {
      return null;
    }

    const messageMap = new Map<string, Linter.LintMessage>();
    const markers = result.result.messages.map((m) => {
      const marker = messageToMarker(m, result.ruleMetadata, monaco);
      messageMap.set(computeKey(marker), m);
      return marker;
    });
    const fixedMarkers = result.fixResult.messages.map((m) =>
      messageToMarker(m, result.ruleMetadata, monaco),
    );
    const fixedCode = result.output ?? code.value;
    return {
      markers,
      fixedCode,
      fixedMarkers,
      messageMap,
    };
  });
  const sourceData = reactive({
    id: seq++,
    fileName,
    code,
    linterServiceResult,
    resultData,
    provideCodeAction,
  });

  watch(fileName, async (newFileName) => {
    if (newFileName === currFileName) {
      return;
    }
    if (!newFileName || props.sources[newFileName]) {
      // Empty or has duplicate file name
      fileName.value = currFileName;
      return;
    }
    if (isReservedFileName(newFileName)) {
      // eslint-disable-next-line no-console -- OK
      console.warn(
        "The specified file name cannot be used as a linting file name on this demo site.",
      );
      fileName.value = currFileName;
      return;
    }
    const old = currFileName;
    currFileName = newFileName;
    const lintServer = await getLintServer();
    await lintServer.removeFile(old);
    update();
    await nextTick();
    inputTabs.value?.setChecked(newFileName);
    activeSource.value = sourceData;
  });
  watch(code, (code, old) => {
    if (code === old) {
      return;
    }
    update();
  });

  return sourceData;

  function update() {
    emitUpdateSources();

    void lint({
      source: sourceData,
      config: configText.value,
      configFileName: configFileName.value,
    });
  }

  function provideCodeAction(
    model: editor.ITextModel,
    _range: Range,
    context: languages.CodeActionContext,
  ): ReturnType<CodeActionProvider> {
    if (context.only !== "quickfix") {
      return undefined;
    }
    const messageMap = resultData.value?.messageMap;
    if (!messageMap) return undefined;

    const actions: languages.CodeAction[] = [];
    for (const marker of context.markers) {
      const message = messageMap.get(computeKey(marker));
      if (!message || !message.ruleId) {
        continue;
      }
      if (message.fix) {
        actions.push(
          createQuickFixCodeAction(
            `Fix this ${message.ruleId} problem`,
            marker,
            model,
            message.fix,
          ),
        );
      }
      if (message.suggestions) {
        for (const suggestion of message.suggestions) {
          actions.push(
            createQuickFixCodeAction(
              `${suggestion.desc} (${message.ruleId})`,
              marker,
              model,
              suggestion.fix,
            ),
          );
        }
      }
    }

    return {
      actions,
      dispose() {
        /* noop */
      },
    };
  }
}

function emitUpdateSources(
  option: {
    configFileName?: string;
    configText?: string;
    packageJson?: string;
  } = {},
) {
  emit(
    "update:sources",
    Object.fromEntries([
      ...allSourceDataList.map((sourceData) => [
        sourceData.fileName,
        sourceData.code,
      ]),
      [
        option.configFileName || configFileName.value,
        option.configText || configText.value,
      ],
      ["package.json", option.packageJson || packageJson.value],
    ]),
  );
}

function handleActiveName(name: string) {
  const a = displaySourceDataList.value.list.find(
    (source) => source.fileName === name,
  );
  if (a) {
    activeSource.value = a;
    disableBuiltinValidate();
  } else if (
    displaySourceDataList.value.envList.some(
      (source) => source.fileName === name,
    )
  ) {
    enableBuiltinValidate({ jsonAs: "jsonc" });
  } else {
    enableBuiltinValidate({ jsonAs: "json" });
  }
}

async function getLintServer(): Promise<LinterService> {
  if (lintServerRef.value) {
    return lintServerRef.value;
  }
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getLintServer();
}

watch([consoleOutput, outputTabs], async ([consoleOutput, outputTabs]) => {
  if (!consoleOutput || !outputTabs) {
    return;
  }
  const lintServer = await setupLintServer({
    consoleOutput,
    outputTabs,
  });
  for (const [fileName, code] of Object.entries(props.sources)) {
    await lintServer.writeFile(fileName, code);
  }
  lintServerRef.value = lintServer;
});

watch(configText, async (config, oldConfig) => {
  if (config === oldConfig) {
    return;
  }
  for (const source of allSourceDataList) {
    await lint({ source, config, configFileName: configFileName.value });
  }
});

onMounted(async () => {
  if (!(await updatePackageJson(packageJson.value))) {
    return;
  }
  const lintServer = await getLintServer();
  await lintServer.install();
  await updateInstalledPackages();
  for (const source of allSourceDataList) {
    await lint({
      source,
      config: configText.value,
      configFileName: configFileName.value,
    });
  }
});

watch(
  packageJson,
  debounce(async (packageJson: string, old: string) => {
    if (packageJson === old) return;
    if (!(await updatePackageJson(packageJson))) {
      return;
    }
    const lintServer = await getLintServer();

    consoleOutput.value?.clear();
    await lintServer.install();
    await updateInstalledPackages();
    await lintServer.restart();
    for (const source of allSourceDataList) {
      await lint({
        source: source as SourceData,
        config: configText.value,
        configFileName: configFileName.value,
      });
    }
  }, 300),
);

async function updatePackageJson(packageJson: string) {
  const lintServer = await getLintServer();
  try {
    await lintServer.updatePackageJson(JSON.parse(packageJson));

    return true;
  } catch (e) {
    outputTabs.value?.setChecked("console");
    consoleOutput.value?.clear();
    consoleOutput.value?.appendLine((e as Error).message);

    return false;
  }
}

/** Read the actual installed packages and display version information. */
async function updateInstalledPackages() {
  const lintServer = await getLintServer();
  let pkg: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  } = {};

  try {
    pkg = JSON.parse(packageJson.value);
  } catch (e) {
    // eslint-disable-next-line no-console -- Demo runtime
    console.warn(e);
  }
  const depsPackageNames = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ];

  installedPackages.length = 0;

  for (const packageName of depsPackageNames) {
    try {
      const json = await lintServer.readFile(
        `/node_modules/${packageName}/package.json`,
      );
      const packageJson = JSON.parse(json);

      installedPackages.push(packageJson);
    } catch (e) {
      // eslint-disable-next-line no-console -- Demo runtime
      console.warn(e);
    }
  }

  for (const sourceData of displaySourceDataList.value.envList) {
    if (!isLockFile(sourceData.fileName)) {
      continue;
    }
    try {
      const content = await lintServer.readFile(sourceData.fileName);
      sourceData.code = content;
    } catch (e) {
      // eslint-disable-next-line no-console -- Demo runtime
      console.warn(e);
    }
  }
}

/** Run the linting and display the results in the results panel and as markers in the editor. */
async function lint({
  source,
  config,
  configFileName,
}: {
  source: SourceData;
  config: string;
  configFileName: ConfigFileName;
}) {
  const lintServer = await getLintServer();

  const version = seq++;

  source.linterServiceResult = null;

  const result = await lintServer.lint({
    version,
    code: source.code,
    fileName: source.fileName,
    config,
    configFileName,
  });

  if (result.version > version) {
    // Overtaken by the next linting
    return;
  }

  // eslint-disable-next-line require-atomic-updates -- OK
  source.linterServiceResult = result;

  outputTabs.value?.setChecked("warnings");
}

function messageToMarker(
  message: Linter.LintMessage,
  ruleMetadata: LinterServiceResultSuccess["ruleMetadata"],
  monaco: Monaco,
): editor.IMarkerData {
  const startLineNumber = message.line;
  const startColumn = message.column;
  const endLineNumber = message.endLine ?? startLineNumber;
  const endColumn = message.endColumn ?? startColumn;
  const meta = message.ruleId ? ruleMetadata[message.ruleId] : null;
  const docUrl = meta?.docs?.url;
  const code =
    docUrl && message.ruleId
      ? {
          value: message.ruleId,
          target:
            // Maybe monaco type bug
            docUrl as never,
        }
      : message.ruleId || "FATAL";

  const marker: editor.IMarkerData = {
    code,
    severity:
      message.severity === 1
        ? monaco.MarkerSeverity.Warning
        : monaco.MarkerSeverity.Error,
    source: "ESLint",
    message: message.message,
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
  };
  return marker;
}

/**
 * Computes the key string from the given marker.
 */
function computeKey(marker: editor.IMarkerData) {
  const code =
    (typeof marker.code === "string"
      ? marker.code
      : marker.code && marker.code.value) || "";
  return `[${marker.startLineNumber},${marker.startColumn},${marker.endLineNumber},${marker.endColumn}]-${code}`;
}

/**
 * Create quick-fix code action.
 */
function createQuickFixCodeAction(
  title: string,
  marker: editor.IMarkerData,
  model: editor.ITextModel,
  fix: { range: [number, number]; text: string },
): languages.CodeAction {
  const start = model.getPositionAt(fix.range[0]);
  const end = model.getPositionAt(fix.range[1]);

  const editRange: IRange = {
    startLineNumber: start.lineNumber,
    startColumn: start.column,
    endLineNumber: end.lineNumber,
    endColumn: end.column,
  };
  return {
    title,
    diagnostics: [marker],
    kind: "quickfix",
    edit: {
      edits: [
        {
          resource: model.uri,
          textEdit: {
            range: editRange,
            text: fix.text,
          },
          versionId: model.getVersionId(),
        },
      ],
    },
  };
}

function handleClickMessage(message: Linter.LintMessage) {
  const source = activeSource.value;
  const editor = source?.editor;
  if (!source || !editor) {
    return;
  }

  // Focus on the message part.
  editor.setSelection({
    startLineNumber: message.line,
    startColumn: message.column,
    endLineNumber: message.endLine ?? message.line,
    endColumn: message.endColumn ?? message.column,
  });
  editor.revealLineInCenter(message.line);

  inputTabs.value?.setChecked(source.fileName);
}

async function handleAddFile() {
  let newFileName = "src/example.js";
  let i = 1;
  while (props.sources[newFileName]) {
    newFileName = `src/example${i++}.js`;
  }
  const content = `console.log("Hello!");`;
  emit("update:sources", {
    ...props.sources,
    [newFileName]: content,
  });
  await nextTick();
  const lintServer = await getLintServer();
  await lintServer.writeFile(newFileName, content);
  inputTabs.value?.setChecked(newFileName);
}

async function handleRemoveSource(name: string) {
  // eslint-disable-next-line no-alert -- OK
  if (!confirm(`Are you sure you want to delete '${name}'?`)) {
    return;
  }
  const lintServer = await getLintServer();
  await lintServer.removeFile(name);
  const newSources = { ...props.sources };
  delete newSources[name];
  emit("update:sources", newSources);
}

function selectFile(nm: string) {
  inputTabs.value?.setChecked(nm);
}

function selectOutput(nm: "console" | "warnings") {
  outputTabs.value?.setChecked(nm);
}
</script>

<template>
  <div class="ep">
    <TreeTabs
      ref="inputTabs"
      @active="handleActiveName"
      @remove="handleRemoveSource"
    >
      <template #tools>
        <div class="ep__menu-tools">
          <button class="ep__tool-button" @click="handleAddFile">+</button>
        </div>
      </template>
      <template
        v-for="(source, index) in displaySourceDataList.list"
        :key="source.id"
      >
        <TabPanel
          :title="source.fileName"
          :name="source.fileName"
          :order="index"
          :removable="displaySourceDataList.list.length > 1"
        >
          <CodeEditor
            :ref="
              (editor: unknown) => {
                source.editor = editor as never;
              }
            "
            v-model:code="source.code"
            v-model:file-name="source.fileName"
            :right-code="source.resultData?.fixedCode ?? source.code"
            :markers="source.resultData?.markers ?? []"
            :right-markers="source.resultData?.fixedMarkers ?? []"
            :code-action-provider="source.provideCodeAction"
          />
        </TabPanel>
      </template>
      <TabPanel
        :title="configFileName"
        name="config"
        :order="displaySourceDataList.list.length"
      >
        <ConfigEditor
          v-model:config="configText"
          v-model:file-name="configFileName"
        />
      </TabPanel>
      <TabPanel
        title="package.json"
        name="package-json"
        :order="displaySourceDataList.list.length + 1"
      >
        <PackageJsonEditor
          v-model:package-json="packageJson"
          :installed-packages="installedPackages"
        />
      </TabPanel>
      <template
        v-for="(source, index) in displaySourceDataList.envList"
        :key="source.id"
      >
        <TabPanel
          :title="source.fileName"
          :name="source.fileName"
          :order="displaySourceDataList.list.length + 2 + index"
          :removable="true"
        >
          <CodeEditor
            v-model:code="source.code"
            v-model:file-name="source.fileName"
            disable-fix
          />
        </TabPanel>
      </template>
    </TreeTabs>
    <TabsPanel ref="outputTabs" class="ep__output-tabs">
      <TabPanel title="Problems" name="warnings" :order="1">
        <WarningsPanel
          :result="activeSource?.linterServiceResult"
          @click-message="handleClickMessage"
        />
      </TabPanel>
      <TabPanel title="Console" name="console" :order="2">
        <ConsoleOutput ref="consoleOutput" />
      </TabPanel>
      <div class="ep__banners">
        <a class="netlify" href="https://www.netlify.com" target="_blank">
          <NetlifyBadge alt="Deploys by Netlify" />
        </a>
      </div>
    </TabsPanel>
  </div>
</template>

<style scoped>
.ep {
  color: var(--ep-color);
  display: grid;
  font-family: system-ui;
  font-size: 0.875rem;
  grid-template-rows: minmax(33vb, 1fr) min-content max(10rem, 33vb);
  min-height: 0;
}

.ep :deep(a) {
  color: var(--ep-link-color);
  text-decoration: none;
}
.ep :deep(a:hover) {
  text-decoration: underline;
}

.ep__menu-tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.ep__tool-button {
  font-family: system-ui;

  color: var(--ep-color);
  background-color: var(--ep-background-color);
  cursor: pointer;
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  padding-block: 0.1rem;
  padding-inline: 0.3rem;

  outline: none;
  appearance: none;

  border: 1px solid var(--ep-border-color);
  border-radius: 2px;

  display: flex;
  align-items: center;
  justify-content: center;
}

.ep :deep(.ep__output-tabs) {
  display: grid;
  grid-template-columns: 1fr 130px;
  grid-template-rows: 100%;
  box-shadow: inset 0 0 6px 0 hsl(0deg 0% 0% / 15%);
  min-width: 0;
}

.ep__banners {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem 1rem;
  justify-content: flex-end;
  box-sizing: border-box;
}
</style>
