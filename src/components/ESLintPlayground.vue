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
  code: string;
  fileName: string;
  config: string;
  packageJson: string;
}>();
const emit =
  defineEmits<
    (
      type:
        | "update:code"
        | "update:fileName"
        | "update:config"
        | "update:packageJson",
      value: string
    ) => void
  >();

const consoleOutput = ref();
const outputTabs = ref();
const lintServerRef = shallowRef<LinterService>();
const monacoRef = shallowRef<Monaco>();
void loadMonaco().then((monaco) => (monacoRef.value = monaco));

const installedPackages = reactive<PackageJsonData[]>([]);
const linterServiceResult = ref<LinterServiceResult>();

const resultData = computed<{
  markers?: editor.IMarkerData[];
  fixedCode?: string;
  fixedMarkers?: editor.IMarkerData[];
  messageMap?: Map<string, Linter.LintMessage>;
} | null>(() => {
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
  if (consoleOutput && outputTabs) {
    lintServerRef.value = await setupLintServer({
      consoleOutput,
      outputTabs,
    });
  }
});

const inputData = computed(() => {
  return {
    code: props.code,
    fileName: props.fileName,
    config: props.config,
  };
});
watch(inputData, (input, oldInput) => {
  if (
    input.code !== oldInput?.code ||
    input.fileName !== oldInput?.fileName ||
    input.config !== oldInput?.config
  ) {
    void lint(input);
  }
});

onMounted(async () => {
  if (await updatePackageJson(props.packageJson)) {
    const lintServer = await getLintServer();
    await lintServer.install();
    await updateInstalledPackages();
    void lint(inputData.value);
  }
});

watch(
  () => props.packageJson,
  async (packageJson) => {
    if (!(await updatePackageJson(packageJson))) {
      return;
    }
    const lintServer = await getLintServer();

    consoleOutput.value.clear();
    await lintServer.install();
    await updateInstalledPackages();
    await lintServer.restart();
    void lint(inputData.value);
  }
);

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
    pkg = JSON.parse(props.packageJson);
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
  code,
  fileName,
  config,
}: {
  code: string;
  fileName: string;
  config: string;
}) {
  const lintServer = await getLintServer();

  const version = seq++;

  linterServiceResult.value = undefined;

  const result = await lintServer.lint({
    version,
    code,
    fileName,
    config,
  });

  if (result.version > version) {
    // Overtaken by the next linting
    return;
  }

  linterServiceResult.value = result;

  outputTabs.value.setChecked("warnings");
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
    <div class="ep-input-tabs">
      <label>
        <input
          type="radio"
          name="eslint_input_tabs"
          class="ep-code-tab"
          data-radio-name="code"
          checked
        />Code
      </label>
      <label>
        <input
          type="radio"
          name="eslint_input_tabs"
          class="ep-config-tab"
          data-radio-name="config"
        />Config
      </label>
      <label>
        <input
          type="radio"
          name="eslint_input_tabs"
          class="ep-package-json-tab"
          data-radio-name="package-json"
        />package.json
      </label>
    </div>
    <div class="ep-inputs">
      <CodeEditor
        :code="code"
        :file-name="fileName"
        :right-code="resultData?.fixedCode ?? code"
        :markers="resultData?.markers ?? []"
        :right-markers="resultData?.fixedMarkers ?? []"
        :code-action-provider="provideCodeAction"
        @update:code="(newCode) => emit('update:code', newCode)"
        @update:file-name="
          (newFileName) => emit('update:fileName', newFileName)
        "
      />
      <ConfigEditor
        :config="config"
        @update:config="(newConfig) => emit('update:config', newConfig)"
      />
      <PackageJsonEditor
        :package-json="packageJson"
        :installed-packages="installedPackages"
        @update:package-json="
          (newPackageJson) => emit('update:packageJson', newPackageJson)
        "
      />
    </div>
    <TabsPanel ref="outputTabs">
      <TabPanel title="Problems" name="warnings">
        <WarningsPanel :result="linterServiceResult" />
      </TabPanel>
      <TabPanel title="Console" name="console">
        <ConsoleOutput ref="consoleOutput" />
      </TabPanel>
    </TabsPanel>
  </div>
</template>
