import type * as monaco from "monaco-editor";
import type { Monaco } from "./monaco-loader";
import type { IRawGrammar, StackElement } from "monaco-textmate";

type MaybePromise<T> = T | Promise<T>;

let onigasmModule: Promise<void> | null = null;

function setupOnigasm() {
  if (onigasmModule) {
    return onigasmModule;
  }
  onigasmModule = import("onigasm").then(async (onigasm) => {
    const url = await import("onigasm/lib/onigasm.wasm?url");
    return onigasm.loadWASM(url.default);
  });
  return onigasmModule;
}

class TokenizerState implements monaco.languages.IState {
  private readonly _ruleStack: StackElement;

  public constructor(ruleStack: StackElement) {
    this._ruleStack = ruleStack;
  }

  public get ruleStack(): StackElement {
    return this._ruleStack;
  }

  public clone(): TokenizerState {
    return new TokenizerState(this._ruleStack);
  }

  public equals(other: monaco.languages.IState): boolean {
    if (
      !other ||
      !(other instanceof TokenizerState) ||
      other !== this ||
      other._ruleStack !== this._ruleStack
    ) {
      return false;
    }
    return true;
  }
}

export function registerTextmateLanguage(
  monaco: Monaco,
  def: {
    language: { id: string; scopeName: string };
    loadGrammarDefinition: () => MaybePromise<IRawGrammar>;
    loadConfig: () => MaybePromise<monaco.languages.LanguageConfiguration>;
  },
): void {
  registerLanguage(monaco, {
    language: def.language,
    loadLang: async () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- class name
      const [, { Registry, INITIAL }] = await Promise.all([
        setupOnigasm(),
        import("monaco-textmate"),
      ]);

      let grammarDefinition: Promise<string> | null = null;

      const registry = new Registry({
        getGrammarDefinition: async () => {
          if (!grammarDefinition) {
            grammarDefinition = Promise.resolve(
              def.loadGrammarDefinition(),
            ).then((grammar) => JSON.stringify(grammar));
          }
          return {
            format: "json",
            content: await grammarDefinition,
          };
        },
      });
      const grammar = await registry.loadGrammar(def.language.scopeName);
      return {
        getInitialState: () => new TokenizerState(INITIAL),
        tokenize: (line: string, state: TokenizerState) => {
          const res = grammar.tokenizeLine(line, state.ruleStack);
          return {
            endState: new TokenizerState(res.ruleStack),
            tokens: res.tokens.map((token) => ({
              ...token,
              scopes: token.scopes[token.scopes.length - 1],
            })),
          };
        },
      };
    },
    loadConfig: def.loadConfig,
  });
}

function registerLanguage(
  monaco: Monaco,
  def: {
    language: { id: string };
    loadLang: () => MaybePromise<monaco.languages.TokensProvider>;
    loadConfig: () => MaybePromise<monaco.languages.LanguageConfiguration>;
  },
): void {
  const { language, loadLang, loadConfig } = def;
  const languageId = language.id;
  monaco.languages.register(language);
  const models = monaco.editor
    .getModels()
    .filter((model) => model.getLanguageId() === languageId);
  if (!models.length) {
    monaco.languages.registerTokensProviderFactory(languageId, {
      create: loadLang,
    });

    monaco.languages.onLanguageEncountered(languageId, () => {
      void Promise.resolve(loadConfig()).then((conf) => {
        monaco.languages.setLanguageConfiguration(languageId, conf);
      });
    });
  } else {
    const lang = loadLang();
    const config = Promise.resolve(loadConfig());
    void Promise.all([lang, config]).then(([l, c]) => {
      monaco.languages.setTokensProvider(languageId, l);
      monaco.languages.setLanguageConfiguration(languageId, c);
    });
  }
}
