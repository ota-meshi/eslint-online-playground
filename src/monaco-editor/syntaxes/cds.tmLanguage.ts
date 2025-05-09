import type { LanguageRegistration } from "shiki";

// https://github.com/cap-js/docs/blob/9f7b450dd0428f296ce7dc08671c66251ef12935/.vitepress/languages/cds.tmLanguage.json
export const grammar: LanguageRegistration = {
  comment: "SAP CAP CDS Syntax 2.0 (open-source)",
  fileTypes: ["cds"],
  name: "cds",
  patterns: [
    {
      comment: "entityDef, aspectDef, and others containing elements",
      begin: "\\b(aspect|(abstract\\s+)?entity|type|event)\\b",
      beginCaptures: {
        "1": {
          name: "keyword.strong.cds",
        },
      },
      end: "(?<=})(;)?|(;)",
      endCaptures: {
        "1": {
          name: "punctuation.terminator.statement.cds",
        },
        "2": {
          name: "punctuation.terminator.statement.cds",
        },
      },
      patterns: [
        {
          include: "#atAnnoParen",
        },
        {
          include: "#atAnnoNoParen",
        },
        {
          // @ts-expect-error -- Comment
          comment: "Aspects",
          begin: ":",
          end: "(?=[{;@])",
          beginCaptures: {
            "0": {
              name: "keyword.operator.cds",
            },
          },
          patterns: [
            {
              include: "#identifiers",
            },
            {
              match: ",",
              name: "punctuation.separator.object.cds",
            },
          ],
        },
        {
          include: "#bracedElementDef",
        },
        {
          include: "#keywords",
        },
        {
          include: "#identifiers",
        },
      ],
    },
    {
      // @ts-expect-error -- Comment
      comment:
        "extendVarious (TODO simplify begin pattern - would currently produce false positives; allow annotationAssignment_ll1)",
      begin:
        "(?i)\\b(extend)\\s+((context|service|aspect|entity|projection|type)\\s+)?((?!@)\\S+)(\\s+(with)(\\s+(actions|definitions|columns|elements|enum))?|(?=\\s*{))",
      beginCaptures: {
        "1": {
          name: "keyword.strong.cds",
        },
        "3": {
          name: "keyword.cds",
        },
        "4": {
          name: "entity.name.type.cds",
        },
        "6": {
          name: "keyword.cds",
        },
        "8": {
          name: "keyword.cds",
        },
      },
      end: "(?<=})(;)?|(;)",
      endCaptures: {
        "1": {
          name: "punctuation.terminator.statement.cds",
        },
        "2": {
          name: "punctuation.terminator.statement.cds",
        },
      },
      patterns: [
        {
          include: "#bracedElementDef",
        },
        {
          include: "#atAnnoParen",
        },
        {
          include: "#atAnnoNoParen",
        },
        {
          include: "#keywords",
        },
        {
          include: "#identifiers",
        },
        {
          match: ",",
          name: "punctuation.separator.object.cds",
        },
      ],
    },
    {
      match: "(?<!\\.)\\b(annotate)\\b\\s*([\\w.]+)\\b\\s*\\b(with)?\\b",
      captures: {
        "1": {
          name: "keyword.strong.control.import.cds",
        },
        "2": {
          name: "entity.name.type.cds",
        },
        "3": {
          name: "keyword.strong.control.import.cds",
        },
      },
    },
    {
      begin: "(?<!\\.)\\b(using)(?!\\s*:)\\b",
      beginCaptures: {
        "1": {
          name: "keyword.strong.control.import.cds",
        },
      },
      end: "(;)|\\n",
      endCaptures: {
        "1": {
          name: "punctuation.terminator.statement.cds",
        },
      },
      patterns: [
        {
          begin: "{",
          beginCaptures: {
            "0": {
              name: "punctuation.definition.modules.begin.cds",
            },
          },
          comment: "{ member1 , member2 as alias2 , [...] }",
          end: "}",
          endCaptures: {
            "0": {
              name: "punctuation.definition.modules.end.cds",
            },
          },
          patterns: [
            {
              captures: {
                "1": {
                  name: "variable.language.default.cds",
                },
                "2": {
                  name: "entity.name.type.cds",
                },
                "3": {
                  name: "keyword.strong.cds",
                },
                "4": {
                  name: "entity.name.type.cds",
                },
              },
              // @ts-expect-error -- Comment
              comment: "(default|name) as alias",
              match:
                "(?:\\b(default)\\b|\\b([$_a-zA-Z][$_a-zA-Z0-9]*)\\b)\\s*(\\bas\\b)\\s*(?:\\b([$_a-zA-Z][$_a-zA-Z0-9]*)\\b)",
            },
            {
              match: ",",
              name: "punctuation.separator.object.cds",
            },
            {
              include: "#comments",
            },
            {
              match: "\\b([$_a-zA-Z][$_a-zA-Z0-9]*)\\b",
              name: "entity.name.type.cds",
            },
          ],
        },
        {
          captures: {
            "1": {
              name: "keyword.operator.asterisk",
            },
            "2": {
              name: "entity.name.type.cds",
            },
            "3": {
              name: "keyword.strong.control.cds",
            },
            "4": {
              name: "entity.name.type.cds",
            },
          },
          // @ts-expect-error -- Comment
          comment: "(default|*|name) as alias",
          match:
            "(?:(\\*)|(?=\\D)(\\b[\\$\\.\\w]+\\b))\\s*(\\bas\\b)\\s*(?=\\D)(\\b[\\$\\.\\w]+\\b)",
        },
        {
          match: "\\*",
          name: "keyword.operator.asterisk",
        },
        {
          match: "\\b(default)\\b",
          name: "variable.language.default.cds",
        },
        {
          include: "#strings",
        },
        {
          include: "#comments",
        },
        {
          match: "(?i)\\b(from)\\b",
          name: "keyword.strong.control.cds",
        },
        {
          match: "\\b([$_a-zA-Z][$_a-zA-Z0-9]*)\\b(?=.*\\bfrom\\b)",
          name: "entity.name.type.cds",
        },
        {
          match: ",",
          name: "punctuation.separator.object.cds",
        },
      ],
    },
    {
      captures: {
        "1": {
          name: "keyword.control.cds",
        },
        "2": {
          name: "variable.language.default.cds",
        },
        "3": {
          name: "variable.other.module.cds",
        },
      },
      // @ts-expect-error -- Comment
      comment: "ES6 export: `export default (variable|class, etc.)`",
      match:
        "(?i)\\b(export)\\b\\s*\\b(default)\\b(?:\\s*)\\b((?!\\bclass\\b|\\blet\\b|\\bvar\\b|\\bconst\\b)[$_a-zA-Z][$_a-zA-Z0-9]*)?\\b",
      name: "meta.export.cds",
    },
    {
      begin: "(?i)\\b(action|function)\\s+([$_a-zA-Z][$_a-zA-Z0-9]*)\\s*(\\()",
      beginCaptures: {
        "1": {
          name: "keyword.strong.cds",
        },
        "2": {
          name: "entity.name.function.cds",
        },
        "3": {
          name: "punctuation.definition.parameters.begin.cds",
        },
      },
      end: "\\)",
      endCaptures: {
        "0": {
          name: "punctuation.definition.parameters.end.cds",
        },
      },
      patterns: [
        {
          include: "#function-params",
        },
      ],
    },
    {
      captures: {
        "1": {
          name: "storage.type.class.cds",
        },
        "2": {
          name: "entity.name.type.class.cds",
        },
        "3": {
          name: "storage.modifier.cds",
        },
        "4": {
          name: "entity.other.inherited-class.cds",
        },
      },
      match:
        "\\b(class)(?:\\s+([$_a-zA-Z][$_a-zA-Z0-9]*))?(?:\\s+(extends)\\s+([$_a-zA-Z][$_a-zA-Z0-9]*))?\\s*($|(?={))",
      name: "meta.class.cds",
    },
    {
      match: "=>",
      name: "storage.type.arrow.cds",
    },
    {
      match: "(?<!\\.|\\$)\\b(let|var)\\b(?!\\$)",
      name: "storage.type.var.cds",
    },
    {
      match: "(?<!\\.|\\$)\\b(get|set|const)\\b(?!\\$)",
      name: "storage.modifier.cds",
    },
    {
      captures: {
        "1": {
          name: "keyword.control.cds",
        },
        "2": {
          name: "storage.modifier.cds",
        },
      },
      match: "(?<!\\.)\\b(yield)(?!\\s*:)\\b(?:\\s*(\\*))?",
      name: "meta.control.yield.cds",
    },
    {
      match: "\\b(false|Infinity|NaN|null|true|undefined)\\b",
      name: "constant.language.cds",
    },
    {
      match: "(?<!\\.)\\b(super|this)(?!\\s*:)\\b",
      name: "variable.language.cds",
    },
    {
      match: "\\;",
      name: "punctuation.terminator.statement.cds",
    },
    {
      captures: {
        "1": {
          name: "punctuation.section.scope.begin.cds",
        },
        "2": {
          name: "punctuation.section.scope.end.cds",
        },
      },
      // @ts-expect-error -- Comment
      comment: "Allows the special return snippet to fire.",
      match: "(\\[)(\\])",
    },
    {
      begin: "{",
      beginCaptures: {
        "0": {
          name: "punctuation.section.scope.begin.cds",
        },
      },
      end: "}",
      endCaptures: {
        "0": {
          name: "punctuation.section.scope.end.cds",
        },
      },
      patterns: [
        {
          include: "$self",
        },
      ],
    },
    {
      begin: "\\(",
      beginCaptures: {
        "0": {
          name: "punctuation.section.scope.begin.cds",
        },
      },
      end: "\\)",
      endCaptures: {
        "0": {
          name: "punctuation.section.scope.end.cds",
        },
      },
      patterns: [
        {
          include: "$self",
        },
      ],
    },
    {
      match: "\\[|\\]",
      name: "meta.brace.square.cds",
    },
    {
      // @ts-expect-error -- Comment
      comment: 'Match classes based on the usage of the "new" operator.',
      match: "(?<=new )([$_a-zA-Z][$_a-zA-Z0-9]*)(?!\\w)",
      name: "support.class.cds",
    },
    {
      // @ts-expect-error -- Comment
      comment: 'Match classes based on the usage of the "instanceof" operator.',
      match: "(?<= instanceof )([$_a-zA-Z][$_a-zA-Z0-9]*)(?!\\w)",
      name: "support.class.cds",
    },
    {
      // @ts-expect-error -- Comment
      comment: 'Match classes based on the usage of the "prototype" property.',
      match: "(?<!\\w)([$_a-zA-Z][$_a-zA-Z0-9]*)(?=\\.prototype\\b)",
      name: "support.class.cds",
    },
    {
      // @ts-expect-error -- Comment
      comment:
        'Matches the "prototype" keyword.  Even though it is not a valid keyword, it is a special constant of sorts.',
      match: "(?i)(?<=\\.)(prototype)\\b",
      name: "keyword.other.cds",
    },
    {
      include: "#atAnnoParen",
    },
    {
      include: "#atAnnoNoParen",
    },
    {
      include: "#keywords",
    },
    {
      include: "#numbers",
    },
    {
      include: "#strings",
    },
    {
      include: "#comments",
    },
    {
      include: "#operators",
    },
    {
      include: "#identifiers",
    },
  ],
  repository: {
    keywords: {
      patterns: [
        {
          // @ts-expect-error -- Comment
          comment: "Association, Composition",
          match:
            '(?<!\\.|\\$)\\b(Association\\b\\s*(?:\\[[0-9.eE+, *-]*\\]\\s*)?to\\b\\s*(?:many\\s*|one\\s*)?|Composition\\b\\s*(?:\\[[0-9.eE+, *-]*\\]\\s*)?of\\b\\s*(?:many\\s*|one\\s*)?)(?:(?=\\s*{)|([$_a-zA-Z][$_a-zA-Z0-9]*|"[^"]*(?:""[^"]*)*"|!\\[[^\\]]*(?:\\]\\][^\\]]*)*\\]))',
          captures: {
            "1": {
              name: "support.class.cds",
            },
            "2": {
              name: "entity.name.type.cds",
            },
          },
        },
        {
          // @ts-expect-error -- Comment
          comment: "Types (exact casing)",
          match:
            "(?<!\\.|\\$)\\b(Binary|Boolean|DateTime|Date|DecimalFloat|Decimal|Double|Int(16|32|64)|Integer64|Integer|LargeBinary|LargeString|Number|String|Timestamp|Time|UInt8|UUID)\\b\\s*(\\([^()]*\\))?(?!\\$|\\s*:)",
          name: "support.class.cds",
        },
        {
          // @ts-expect-error -- Comment
          comment: "CQL keywords (arbitrary casing)",
          match:
            "(?i)(?<!\\.|\\$)\\b(all|and|any|asc|between|by|case|cast|cross|desc|distinct|element|elements|escape|except|excluding|exists|first|from|full|group|group by|having|in|inner|intersect|into|is|join|last|left|like|limit|many|minus|mixin|not null|not|null|nulls|offset|one|or|order by|outer|redirected to|select|some|top|type of|union|where|with)\\b(?!\\$|\\s*:)",
          name: "keyword.cds",
        },
        {
          // @ts-expect-error -- Comment
          comment: "CQL keywords, strong (arbitrary casing)",
          match: "(?i)(?<!\\.|\\$)\\b(as|key|on|type)\\b(?!\\$|\\s*:)",
          name: "keyword.strong.cds",
        },
        {
          // @ts-expect-error -- Comment
          comment: "CDL keywords (lowercase)",
          match:
            "(?<!\\.|\\$)\\b(array of|column|columns|current|day|default|depends|else|enabled|end|generated|hana|hour|identity|import|index|language|layout|leading|masked|merge|minute|minutes|mode|month|name|new|no|off|only|others|parameters|partition|partitions|priority|projection|projection on|queue|range|ratio|reset|returns|right|row|search|second|start|storage|store|table|technical|then|trailing|trim|unique|unload|value|values|virtual|when|with parameters|year)\\b(?!\\$|\\s*:)",
          name: "keyword.cds",
        },
        {
          // @ts-expect-error -- Comment
          comment: "CDL keywords, strong (lowercase)",
          match:
            "(?<!\\.|\\$)\\b(abstract|action|actions|annotation|aspect|context|define|entity|enum|event|extend|function|namespace|service|view)\\b(?!\\$|\\s*:)",
          name: "keyword.strong.cds",
        },
      ],
    },
    identifiers: {
      patterns: [
        {
          match:
            '(?<!@)(?:\\$?\\b[_a-zA-Z][$_a-zA-Z0-9]*|"[^"]*(?:""[^"]*)*"|!\\[[^\\]]*(?:\\]\\][^\\]]*)*\\])',
          name: "entity.name.type.cds",
        },
      ],
    },
    comments: {
      patterns: [
        {
          begin: "/\\*\\*(?!/)",
          beginCaptures: {
            "0": {
              name: "punctuation.definition.comment.begin.cds",
            },
          },
          end: "\\*/",
          endCaptures: {
            "0": {
              name: "punctuation.definition.comment.end.cds",
            },
          },
          name: "comment.block.documentation.cds",
        },
        {
          begin: "/\\*",
          beginCaptures: {
            "0": {
              name: "punctuation.definition.comment.begin.cds",
            },
          },
          end: "\\*/",
          endCaptures: {
            "0": {
              name: "punctuation.definition.comment.end.cds",
            },
          },
          name: "comment.block.cds",
        },
        {
          match: "//.*",
          name: "comment.line.double-slash.cds",
        },
      ],
    },
    "function-params": {
      patterns: [
        {
          match:
            '\\$?\\b[_a-zA-Z][$_a-zA-Z0-9]*|"[^"]*(?:""[^"]*)*"|!\\[[^\\]]*(?:\\]\\][^\\]]*)*\\]',
          name: "variable.parameter.function.cds",
        },
        {
          match: ",",
          name: "punctuation.separator.object.cds",
        },
        {
          include: "#comments",
        },
        {
          include: "#operators",
        },
      ],
    },
    numbers: {
      patterns: [
        {
          match: "(?<!\\w|\\$)0[xX]\\h+\\b",
          name: "constant.numeric.hex.cds",
        },
        {
          match: "(?<!\\w|\\$)0[bB][01]+\\b",
          name: "constant.numeric.binary.cds",
        },
        {
          match: "(?<!\\w|\\$)0[oO][0-7]+\\b",
          name: "constant.numeric.octal.cds",
        },
        {
          match: "(?<!\\w|\\$)[+-]?[0-9]+('.'[0-9]+)?([eE][+-]?[0-9]+)?(?!\\w)",
          name: "constant.numeric.cds",
        },
      ],
    },
    operators: {
      patterns: [
        {
          match: "!=|<=|>=|<>|<|>",
          name: "keyword.operator.comparison.cds",
        },
        {
          match: "\\|\\|",
          name: "keyword.operator.concatenator.cds",
        },
        {
          match: "&|\\||\\^|~",
          name: "keyword.operator.bitwise.cds",
        },
        {
          match: "\\:\\s*(localized)\\s+",
          captures: {
            "1": {
              name: "keyword.cds",
            },
          },
        },
        {
          match: "[?:]",
          name: "keyword.operator.cds",
        },
        {
          match: "!",
          name: "keyword.operator.logical.cds",
        },
        {
          match: "=|\\:",
          name: "keyword.operator.assignment.cds",
        },
        {
          match: "%|\\*|/|\\-|\\+",
          name: "keyword.operator.arithmetic.cds",
        },
      ],
    },
    strings: {
      patterns: [
        {
          begin: "'",
          beginCaptures: {
            "0": {
              name: "punctuation.definition.string.begin.cds",
            },
          },
          end: "'(?!')",
          endCaptures: {
            "0": {
              name: "punctuation.definition.string.end.cds",
            },
          },
          patterns: [
            {
              match: "''",
              name: "meta.single-quote.doubled.cds",
            },
          ],
          name: "string.quoted.single.cds",
        },
        {
          begin: "`",
          beginCaptures: {
            "0": {
              name: "punctuation.definition.string.begin.cds",
            },
          },
          end: "`(?!`)",
          endCaptures: {
            "0": {
              name: "punctuation.definition.string.end.cds",
            },
          },
          name: "string.quoted.other.template.cds",
          patterns: [
            {
              match: "``",
              name: "string.quoted.other.template.block.cds",
            },
            {
              include: "#interpolation",
            },
            {
              include: "#escapes",
            },
          ],
        },
      ],
    },
    escapes: {
      match: "\\\\([xu$]\\{?[0-9a-fA-F]+}?|.|$)",
      name: "constant.character.escape.cds",
    },
    selectItemDef: {
      begin: "^\\s*(?=\\*|.+\\s+as\\s+)",
      end: "(?=})|(,)",
      patterns: [
        {
          include: "#bracedElementDef",
        },
        {
          include: "#strings",
        },
        {
          include: "#comments",
        },
        {
          include: "#atAnnoParen",
        },
        {
          include: "#atAnnoNoParen",
        },
        {
          include: "#keywords",
        },
        {
          include: "#bracketedExpression",
        },
        {
          // @ts-expect-error -- Comment
          comment: "Element name or type",
          match:
            '(?<!@)(?:\\$?\\b[_a-zA-Z][$_a-zA-Z0-9]*|"[^"]*(?:""[^"]*)*"|!\\[[^\\]]*(?:\\]\\][^\\]]*)*\\])',
          name: "entity.other.attribute-name.cds",
        },
        {
          include: "#operators",
        },
        {
          include: "#numbers",
        },
        {
          match: ",",
          name: "punctuation.separator.object.cds",
        },
      ],
    },
    elementDef: {
      begin:
        "(?!\\s*@)(?:(?=\\()|\\b(virtual(?:\\s+))?(key(?:\\s+))?(masked(?:\\s+))?(element(?:\\s+))?)",
      beginCaptures: {
        "1": {
          name: "keyword.cds",
        },
        "2": {
          name: "keyword.strong.cds",
        },
        "3": {
          name: "keyword.cds",
        },
        "4": {
          name: "keyword.cds",
        },
      },
      end: "(?=})|(;)",
      endCaptures: {
        "1": {
          name: "punctuation.terminator.statement.cds",
        },
      },
      patterns: [
        {
          include: "#bracedElementDef",
        },
        {
          include: "#strings",
        },
        {
          include: "#comments",
        },
        {
          include: "#atAnnoParen",
        },
        {
          include: "#atAnnoNoParen",
        },
        {
          include: "#keywords",
        },
        {
          include: "#bracketedExpression",
        },
        {
          // @ts-expect-error -- Comment
          comment: "Element name or type",
          match:
            '(?<!@)(?:\\$?\\b[_a-zA-Z][$_a-zA-Z0-9]*|"[^"]*(?:""[^"]*)*"|!\\[[^\\]]*(?:\\]\\][^\\]]*)*\\])(?=\\s*[:{,@])',
          name: "entity.other.attribute-name.cds",
        },
        {
          // @ts-expect-error -- Comment
          comment: "Whole-line element name",
          match:
            '^\\s*([$_a-zA-Z][$_a-zA-Z0-9]*|"[^"]*(?:""[^"]*)*"|!\\[[^\\]]*(?:\\]\\][^\\]]*)*\\])\\s*$',
          captures: {
            "1": {
              name: "entity.other.attribute-name.cds",
            },
          },
        },
        {
          include: "#identifiers",
        },
        {
          include: "#operators",
        },
        {
          include: "#numbers",
        },
        {
          match: ",",
          name: "punctuation.separator.object.cds",
        },
        {
          // @ts-expect-error -- Comment
          comment: "TODO include expressions",
        },
      ],
    },
    bracedElementDef: {
      // @ts-expect-error -- Comment
      comment:
        "Braces enclosing all elementDefs and extendElements; also typeStructs",
      begin: "{",
      beginCaptures: {
        "0": {
          name: "punctuation.section.scope.begin.cds",
        },
      },
      end: "}",
      endCaptures: {
        "0": {
          name: "punctuation.section.scope.end.cds",
        },
      },
      patterns: [
        {
          include: "#comments",
        },
        {
          include: "#atAnnoParen",
        },
        {
          include: "#atAnnoNoParen",
        },
        {
          include: "#extendElement",
        },
        {
          include: "#selectItemDef",
        },
        {
          include: "#elementDef",
        },
      ],
    },
    extendElement: {
      begin: "\\b(?=extend\\b.*\\bwith\\b)",
      end: "(?<=})(;)?|(;)",
      endCaptures: {
        "1": {
          name: "punctuation.terminator.statement.cds",
        },
        "2": {
          name: "punctuation.terminator.statement.cds",
        },
      },
      patterns: [
        {
          begin: "\\bextend\\b",
          beginCaptures: {
            "0": {
              name: "keyword.strong.cds",
            },
          },
          end: "\\bwith\\b",
          endCaptures: {
            "0": {
              name: "keyword.cds",
            },
          },
          patterns: [
            {
              match: "element(?!(?:\\s*/\\*.*\\*/\\s*|\\s+)?with\\b)",
              name: "keyword.cds",
            },
            {
              match:
                '(?<!@)(?:\\$?\\b[_a-zA-Z][$_a-zA-Z0-9]*|"[^"]*(?:""[^"]*)*"|!\\[[^\\]]*(?:\\]\\][^\\]]*)*\\])',
              name: "entity.other.attribute-name.cds",
            },
            {
              include: "#comments",
            },
          ],
        },
        {
          include: "#atAnnoParen",
        },
        {
          include: "#atAnnoNoParen",
        },
        {
          begin: "{",
          beginCaptures: {
            "0": {
              name: "punctuation.section.scope.begin.cds",
            },
          },
          end: "}",
          endCaptures: {
            "0": {
              name: "punctuation.section.scope.end.cds",
            },
          },
          patterns: [
            {
              include: "#extendElement",
            },
            {
              include: "#elementDef",
            },
          ],
        },
        {
          include: "#comments",
        },
        {
          include: "#keywords",
        },
        {
          include: "#identifiers",
        },
        {
          include: "#operators",
        },
        {
          match: "\\(",
          name: "punctuation.section.scope.begin.cds",
        },
        {
          match: "\\)",
          name: "punctuation.section.scope.end.cds",
        },
        {
          include: "#numbers",
        },
      ],
    },

    atAnnoParen: {
      begin: "(@)\\s*(\\()",
      beginCaptures: {
        "1": {
          name: "entity.name.tag.at.cds",
        },
        "2": {
          name: "punctuation.section.scope.begin.cds",
        },
      },
      end: "\\)",
      endCaptures: {
        "0": {
          name: "punctuation.section.scope.end.cds",
        },
      },
      patterns: [
        {
          include: "#annotationName",
        },
        {
          include: "#optColonAndStructure",
        },
        {
          include: "#optColonAndArray",
        },
        {
          include: "#colonAndNumber",
        },
        {
          include: "#colonAndString",
        },
        {
          include: "#colonAndTemplateString",
        },
        {
          include: "#colonAndHashIdent",
        },
        {
          include: "#colonAndConstant",
        },
        {
          match: ",",
          name: "punctuation.separator.object.cds",
        },
        {
          include: "#comments",
        },
      ],
    },

    atAnnoNoParen: {
      begin: "(@)(?!\\s*\\()",
      // @ts-expect-error -- Comment
      comment:
        "'end' uses lookahead, since end of annotation value itself cannot be safely determined currently",
      end: "(?<=[}\\]'`])(?=\\s*($|[@;]))|(?<![@:])(?!\\s*:)(?=$|[\\s@,;(){}\\[\\]'`/\"!]|\\b[$_a-zA-Z])",
      captures: {
        "1": {
          name: "entity.name.tag.at.cds",
        },
      },
      patterns: [
        {
          include: "#annotationName",
        },
        {
          include: "#optColonAndStructure",
        },
        {
          include: "#optColonAndArray",
        },
        {
          include: "#colonAndNumber",
        },
        {
          include: "#colonAndString",
        },
        {
          include: "#colonAndTemplateString",
        },
        {
          include: "#colonAndHashIdent",
        },
        {
          include: "#colonAndConstant",
        },
        {
          include: "#comments",
        },
      ],
    },

    atAnnoName: {
      begin: "(@)",
      beginCaptures: {
        "1": {
          name: "entity.name.tag.at.cds",
        },
      },
      end: '(?:(?<=[$"\\]])(?=\\s*[@:;])|(?<=[_a-zA-Z0-9])\\b)(?![#.])',
      // @ts-expect-error -- Comment
      comment: "!TODO alternative end: (?=\\s*(?:$|[@,;:)]))",
      patterns: [
        {
          include: "#annotationName",
        },
      ],
    },

    annotationName: {
      // @ts-expect-error -- Comment
      comment: "annotationPath ( '#' annotationPathVariant ) ?",
      begin: '(?=[$_"!a-zA-Z0-9])',
      end: '(?:(?<=[$"\\]])(?=\\s*[@:;])|(?<=[_a-zA-Z0-9])\\b)(?!\\s*[#.])',
      patterns: [
        {
          match:
            '[$_a-zA-Z][$_a-zA-Z0-9]*|"[^"]*(?:""[^"]*)*"|!\\[[^\\]]*(?:\\]\\][^\\]]*)*\\]',
          name: "entity.name.tag.cds",
        },
        {
          match: "\\s*(\\.)\\s*(@)?",
          captures: {
            "1": {
              name: "entity.name.tag.dot.cds",
            },
            "2": {
              name: "entity.name.tag.at.cds",
            },
          },
        },
        {
          match: "\\s*(#)\\s*",
          captures: {
            "1": {
              name: "entity.name.tag.hash.cds",
            },
          },
        },
      ],
    },

    optColonAndStructure: {
      begin: "(:)?\\s*({)",
      beginCaptures: {
        "1": {
          name: "keyword.operator.colon",
        },
        "2": {
          name: "punctuation.section.scope.begin.cds",
        },
      },
      end: "}",
      endCaptures: {
        "0": {
          name: "punctuation.section.scope.end.cds",
        },
      },
      patterns: [
        {
          include: "#atAnnoNoParen",
        },
        {
          // @ts-expect-error -- Comment
          comment: "annotationPath ( '#' annotationPathVariant )?",
          include: "#annotationName",
        },
        {
          include: "#optColonAndStructure",
        },
        {
          include: "#optColonAndArray",
        },
        {
          include: "#colonAndNumber",
        },
        {
          include: "#colonAndString",
        },
        {
          include: "#colonAndTemplateString",
        },
        {
          include: "#colonAndHashIdent",
        },
        {
          include: "#colonAndConstant",
        },
        {
          match: ",",
          name: "punctuation.separator.object.cds",
        },
        {
          include: "#comments",
        },
      ],
    },

    optColonAndArray: {
      begin: "(:)?\\s*(\\[)",
      beginCaptures: {
        "1": {
          name: "keyword.operator.colon",
        },
        "2": {
          name: "punctuation.section.scope.begin.cds",
        },
      },
      end: "\\]",
      endCaptures: {
        "0": {
          name: "punctuation.section.scope.end.cds",
        },
      },
      patterns: [
        {
          include: "#atAnnoNoParen",
        },
        {
          // @ts-expect-error -- Comment
          comment: "annotationPath ( '#' annotationPathVariant )?",
          include: "#annotationName",
        },
        {
          match: "\\.{3}",
          captures: {
            "0": {
              name: "keyword.operator.ellipsis",
            },
          },
        },
        {
          match: "(?i)(up)\\s+(to)\\b",
          captures: {
            "1": {
              name: "keyword.cds",
            },
            "2": {
              name: "keyword.cds",
            },
          },
        },
        {
          include: "#optColonAndStructure",
        },
        {
          include: "#optColonAndArray",
        },
        {
          include: "#literalValue",
        },
        {
          match: ",",
          name: "punctuation.separator.object.cds",
        },
        {
          include: "#comments",
        },
      ],
    },
    colonAndNumber: {
      begin: "(:)\\s*(?=[0-9+-])",
      end: "(?<=[\\h0-9])\\b",
      beginCaptures: {
        "1": {
          name: "keyword.operator.colon",
        },
      },
      patterns: [
        {
          include: "#numbers",
        },
        {
          include: "#comments",
        },
      ],
    },
    colonAndString: {
      begin: "(:)\\s*(x|date|time(?:stamp)?)?\\s*(')",
      beginCaptures: {
        "1": {
          name: "keyword.operator.colon",
        },
        "2": {
          name: "support.class.cds",
        },
        "3": {
          name: "string.quoted.single.cds punctuation.definition.string.begin.cds",
        },
      },
      end: "'(?!')",
      endCaptures: {
        "0": {
          name: "string.quoted.single.cds punctuation.definition.string.end.cds",
        },
      },
      patterns: [
        {
          match: "''",
          name: "string.quoted.single.cds meta.single-quote.doubled.cds",
        },
        {
          match: ".",
          name: "string.quoted.single.cds",
        },
        {
          include: "#comments",
        },
      ],
    },
    colonAndTemplateString: {
      begin: "(:)\\s*(?=`)",
      end: "(?<=`)",
      beginCaptures: {
        "1": {
          name: "keyword.operator.colon",
        },
      },
      patterns: [
        {
          include: "#strings",
        },
        {
          include: "#comments",
        },
      ],
    },
    colonAndHashIdent: {
      match:
        '(:)\\s*(#)\\s*([$_a-zA-Z][$_a-zA-Z0-9]*|"[^"]*(?:""[^"]*)*"|!\\[[^\\]]*(?:\\]\\][^\\]]*)*\\])',
      captures: {
        "1": {
          name: "keyword.operator.colon",
        },
        "2": {
          name: "entity.name.tag.hash.cds",
        },
        "3": {
          name: "entity.name.tag.cds",
        },
      },
      patterns: [
        {
          include: "#comments",
        },
      ],
    },
    colonAndConstant: {
      match: "(?i)(:)\\s*(null|true|false)\\b",
      captures: {
        "1": {
          name: "keyword.operator.colon",
        },
        "2": {
          name: "constant.language.cds",
        },
      },
      patterns: [
        {
          include: "#comments",
        },
      ],
    },

    literalValue: {
      comment:
        "the rules grouped here, when preceded by ':', are found in their own separate rules",
      patterns: [
        {
          // @ts-expect-error -- Comment
          comment: "'#' ident",
          match:
            '(#)\\s*([$_a-zA-Z][$_a-zA-Z0-9]*|"[^"]*(?:""[^"]*)*"|!\\[[^\\]]*(?:\\]\\][^\\]]*)*\\])',
          captures: {
            "1": {
              name: "entity.name.tag.hash.cds",
            },
            "2": {
              name: "entity.name.tag.cds",
            },
          },
        },
        {
          match: "(?i)\\b(?:null|true|false)\\b",
          name: "constant.language.cds",
        },
        {
          include: "#numbers",
        },
        {
          include: "#strings",
        },
        {
          // @ts-expect-error -- Comment
          comment: "quotedLiteral",
          match: "(?i)\\b(x|date|time(?:stamp)?)\\s*((')[^']*('))",
          captures: {
            "1": {
              name: "support.class.cds",
            },
            "2": {
              name: "string.quoted.single.cds",
            },
            "3": {
              name: "punctuation.definition.string.begin.cds",
            },
            "4": {
              name: "punctuation.definition.string.end.cds",
            },
          },
        },
        {
          // @ts-expect-error -- Comment
          comment: "TODO include '(' condition ')'",
        },
      ],
    },
    bracketedExpression: {
      begin: "\\(",
      beginCaptures: {
        "0": {
          name: "punctuation.section.scope.begin.cds",
        },
      },
      end: "\\)",
      endCaptures: {
        "0": {
          name: "punctuation.section.scope.end.cds",
        },
      },
      patterns: [
        {
          include: "#bracedElementDef",
        },
        {
          include: "#keywords",
        },
        {
          match:
            '(?i)(?<!@|select from )(?:\\$?\\b[_a-zA-Z][$_a-zA-Z0-9]*|"[^"]*(?:""[^"]*)*"|!\\[[^\\]]*(?:\\]\\][^\\]]*)*\\])',
          captures: {
            "0": {
              name: "entity.other.attribute-name.cds",
            },
          },
        },
        {
          include: "#identifiers",
        },
        {
          include: "#operators",
        },
      ],
    },
  },
  scopeName: "source.cds",
};
