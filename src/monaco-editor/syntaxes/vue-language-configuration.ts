import type * as monaco from "monaco-editor";

// Copied from https://github.com/vuejs/language-tools/blob/1769cd6b94ec9e0cc2681b8dbba904f35856ba1c/extensions/vscode/languages/vue-language-configuration.json
export function getConfig(
  monacoModule: typeof monaco,
): monaco.languages.LanguageConfiguration {
  return {
    comments: {
      blockComment: ["<!--", "-->"],
    },
    brackets: [
      ["<!--", "-->"],
      ["<", ">"],
      ["{", "}"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      // html
      {
        open: "{",
        close: "}",
      },
      {
        open: "[",
        close: "]",
      },
      {
        open: "(",
        close: ")",
      },
      {
        open: "'",
        close: "'",
      },
      {
        open: '"',
        close: '"',
      },
      {
        open: "<!--",
        close: "-->",
        notIn: ["comment", "string"],
      },
      // javascript
      {
        open: "`",
        close: "`",
        notIn: ["string", "comment"],
      },
      {
        open: "/**",
        close: " */",
        notIn: ["string"],
      },
    ],
    autoCloseBefore: ";:.,=}])><`'\" \n\t",
    surroundingPairs: [
      // html
      {
        open: "'",
        close: "'",
      },
      {
        open: '"',
        close: '"',
      },
      {
        open: "{",
        close: "}",
      },
      {
        open: "[",
        close: "]",
      },
      {
        open: "(",
        close: ")",
      },
      {
        open: "<",
        close: ">",
      },
      // javascript
      { open: "`", close: "`" },
    ],
    colorizedBracketPairs: [],
    folding: {
      markers: {
        start: /^\s*<!--\s*#region\b.*-->/,
        end: /^\s*<!--\s*#endregion\b.*-->/,
      },
    },
    wordPattern: /(-?\d*\.\d\w*)|([^\s!"$&'()*+,./:;<=>@[\\\]^`{|}~]+)/,
    onEnterRules: [
      {
        beforeText:
          // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/optimal-quantifier-concatenation, regexp/no-useless-assertions -- ignore
          /<(?!area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr|script|style)([\w:][\w\-.:]*)(?:[^"'/>]|"[^"]*"|'[^']*')*(?!\/)>[^<]*$/i,
        afterText: /^<\/([\w:][\w\-.:]*)\s*>/,
        action: {
          indentAction: monacoModule.languages.IndentAction.IndentOutdent,
        },
      },
      {
        beforeText:
          // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/optimal-quantifier-concatenation, regexp/no-useless-assertions -- ignore
          /<(?!area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr|script|style)([\w:][\w\-.:]*)(?:[^"'/>]|"[^"]*"|'[^']*')*(?!\/)>[^<]*$/i,
        action: {
          indentAction: monacoModule.languages.IndentAction.Indent,
        },
      },
    ],
    // https://github.com/vuejs/language-tools/issues/1762
    indentationRules: {
      // "increaseIndentPattern": "<(?!\\?|(?:area|base|br|col|frame|hr|html|img|input|keygen|link|menuitem|meta|param|source|track|wbr|script|style)\\b|[^>]*\\/>)([-_\\.A-Za-z0-9]+)(?=\\s|>)\\b[^>]*>(?!.*<\\/\\1>)|<!--(?!.*-->)|\\{[^}\"']*$",
      // add (?!\\s*\\() to fix https://github.com/vuejs/language-tools/issues/1847#issuecomment-1246101071
      increaseIndentPattern:
        /<(?!\?|(?:area|base|br|col|frame|hr|html|img|input|keygen|link|menuitem|meta|param|source|track|wbr|script|style)\b|[^>]*\/>)([\w\-.]+)(?=\s|>)\b[^>]*>(?!\s*\()(?!.*<\/\1>)|<!--(?!.*-->)|\{[^"'}]*$/,
      decreaseIndentPattern: /^\s*(<\/(?!html)[\w\-.]+\b[^>]*>|-->|\})/,
    },
  };
}
