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
import "./playground.css";
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
import type { CodeActionProvider } from "../monaco-editor/monaco-setup";

const props = defineProps<{
  sources: Record<string, string>;
}>();
const emit =
  defineEmits<
    (type: "update:sources", value: Record<string, string>) => void
  >();

const consoleOutput = ref();
const outputTabs = ref();
const lintServerRef = shallowRef<LinterService>();
const monacoRef = shallowRef<Monaco>();
void loadMonaco().then((monaco) => (monacoRef.value = monaco));

const installedPackages = reactive<PackageJsonData[]>([]);

const sourceDataList = reactive<SourceData[]>([]);

const config = computed({
  get: () => props.sources[".eslintrc.json"] || "{}",
  set: (value) => {
    emit("update:sources", { ...props.sources, ".eslintrc.json": value });
  },
});
const packageJson = computed({
  get: () => props.sources["package.json"] || "{}",
  set: (value) => {
    emit("update:sources", { ...props.sources, "package.json": value });
  },
});
type ResultData = {
  markers?: editor.IMarkerData[];
  fixedCode?: string;
  fixedMarkers?: editor.IMarkerData[];
  messageMap?: Map<string, Linter.LintMessage>;
};

type SourceData = {
  fileName: string;
  code: string;
  linterServiceResult: LinterServiceResult | null;
  resultData: ResultData | null;
  provideCodeAction: (
    model: editor.ITextModel,
    _range: Range,
    context: languages.CodeActionContext
  ) => ReturnType<CodeActionProvider>;
};

watch(
  () => props.sources,
  (newSources, oldSources) => {
    if (newSources === oldSources) {
      return;
    }
    for (const [fileName, code] of Object.entries(newSources)) {
      if (fileName === ".eslintrc.json" || fileName === "package.json") {
        continue;
      }
      const sourceData = sourceDataList.find((d) => d.fileName === fileName);
      if (sourceData) {
        sourceData.code = code;
      } else {
        sourceDataList.push(createSourceData(fileName, code));
      }
    }
    sourceDataList.sort((a, b) => a.fileName.localeCompare(b.fileName));
  },
  { immediate: true }
);

function createSourceData(initFileName: string, initCode: string): SourceData {
  const linterServiceResult = ref<LinterServiceResult | null>(null);
  const fileName = ref(initFileName);
  const code = ref(initCode);

  watch([fileName, code], (newValues, oldValues) => {
    if (newValues.every((newValue, i) => newValue === oldValues[i])) {
      return;
    }
    update();
  });

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
      messageToMarker(m, result.ruleMetadata, monaco)
    );
    const fixedCode = result.output || "";
    return {
      markers,
      fixedCode,
      fixedMarkers,
      messageMap,
    };
  });
  const sourceData = reactive({
    fileName,
    code,
    linterServiceResult,
    resultData,
    provideCodeAction,
  });
  return sourceData;

  function update() {
    sourceDataList.sort((a, b) => a.fileName.localeCompare(b.fileName));

    emit(
      "update:sources",
      Object.fromEntries([
        ...sourceDataList.map((sourceData) => [
          sourceData.fileName,
          sourceData.code,
        ]),
        [".eslintrc.json", config.value],
        ["package.json", packageJson.value],
      ])
    );

    void lint({ source: sourceData, config: config.value });
  }

  function provideCodeAction(
    model: editor.ITextModel,
    _range: Range,
    context: languages.CodeActionContext
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
            message.fix
          )
        );
      }
      if (message.suggestions) {
        for (const suggestion of message.suggestions) {
          actions.push(
            createQuickFixCodeAction(
              `${suggestion.desc} (${message.ruleId})`,
              marker,
              model,
              suggestion.fix
            )
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

const activeSource = shallowRef(sourceDataList[0]);

function handleActiveName(name: string) {
  const a = sourceDataList.find((source) => source.fileName === name);
  if (a) {
    activeSource.value = a;
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

let seq = 0;

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

watch(config, async (config, oldConfig) => {
  if (config !== oldConfig) {
    for (const source of sourceDataList) {
      await lint({ source, config });
    }
  }
});

onMounted(async () => {
  if (!(await updatePackageJson(packageJson.value))) {
    return;
  }
  const lintServer = await getLintServer();
  await lintServer.install();
  await updateInstalledPackages();
  for (const source of sourceDataList) {
    await lint({ source, config: config.value });
  }
});

watch(packageJson, async (packageJson, old) => {
  if (packageJson === old) return;
  if (!(await updatePackageJson(packageJson))) {
    return;
  }
  const lintServer = await getLintServer();

  consoleOutput.value.clear();
  await lintServer.install();
  await updateInstalledPackages();
  await lintServer.restart();
  for (const source of sourceDataList) {
    await lint({ source: source as SourceData, config: config.value });
  }
});

async function updatePackageJson(packageJson: string) {
  const lintServer = await getLintServer();
  try {
    await lintServer.updatePackageJson(JSON.parse(packageJson));

    return true;
  } catch (e) {
    outputTabs.value.setChecked("console");
    consoleOutput.value.clear();
    consoleOutput.value.appendLine((e as Error).message);

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
        `/node_modules/${packageName}/package.json`
      );
      const packageJson = JSON.parse(json);

      installedPackages.push(packageJson);
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
}: {
  source: SourceData;
  config: string;
}) {
  const lintServer = await getLintServer();

  const version = seq++;

  source.linterServiceResult = null;

  const result = await lintServer.lint({
    version,
    code: source.code,
    fileName: source.fileName,
    config,
  });

  if (result.version > version) {
    // Overtaken by the next linting
    return;
  }

  // eslint-disable-next-line require-atomic-updates -- OK
  source.linterServiceResult = result;

  outputTabs.value.setChecked("warnings");
}

function messageToMarker(
  message: Linter.LintMessage,
  ruleMetadata: LinterServiceResultSuccess["ruleMetadata"],
  monaco: Monaco
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
  fix: { range: [number, number]; text: string }
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
</script>

<template>
  <div class="ep">
    <TreeTabs @active="handleActiveName">
      <template
        v-for="(source, index) in sourceDataList"
        :key="source.fileName"
      >
        <TabPanel
          :title="source.fileName"
          :name="source.fileName"
          :order="index"
        >
          <CodeEditor
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
        title=".eslintrc.json"
        name="config"
        :order="sourceDataList.length"
      >
        <ConfigEditor v-model:config="config" />
      </TabPanel>
      <TabPanel
        title="package.json"
        name="package-json"
        :order="sourceDataList.length + 1"
      >
        <PackageJsonEditor
          v-model:package-json="packageJson"
          :installed-packages="installedPackages"
        />
      </TabPanel>
    </TreeTabs>
    <TabsPanel ref="outputTabs" content-top-shadow>
      <TabPanel title="Problems" name="warnings" :order="1">
        <WarningsPanel :result="activeSource.linterServiceResult" />
      </TabPanel>
      <TabPanel title="Console" name="console" :order="2">
        <ConsoleOutput ref="consoleOutput" />
      </TabPanel>
    </TabsPanel>
  </div>
</template>

<style scoped>
.ep {
  color: var(--ep-color);
  display: grid;
  font-family: system-ui;
  font-size: 0.875rem;
  grid-template-rows: 1fr min-content max(10rem, 33vb);
}

.ep :deep(a) {
  color: var(--ep-link-color);
  text-decoration: none;
}
.ep :deep(a:hover) {
  text-decoration: underline;
}
</style>
