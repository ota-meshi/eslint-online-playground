import type { LanguageRegistration } from "shiki";

// Copied from https://github.com/Digitalbrainstem/ejs-grammar/blob/4b2e0c8a36027ef5c3f83d01d42990d1dbe47c41/syntaxes/ejs.json
export const grammar: LanguageRegistration = {
  injectTo: ["text.html"],
  name: "ejs",
  scopeName: "text.html.ejs",
  injectionSelector: "L:text.html",
  patterns: [
    {
      include: "#tag-block-comment",
    },
    {
      include: "#tag-single-line-section-comment",
    },
    {
      include: "#tag-section-comment",
    },
    {
      include: "#tag-ejs-single-line",
    },
    {
      include: "#tag-ejs-multi-line",
    },
  ],
  repository: {
    "tag-block-comment": {
      begin: "<[%?]#",
      beginCaptures: {
        0: {
          name: "punctuation.definition.comment.ejs",
        },
      },
      end: "[%?]>",
      endCaptures: {
        0: {
          name: "punctuation.definition.comment.ejs",
        },
      },
      name: "comment.block.ejs",
    },
    "tag-single-line-section-comment": {
      begin: "(<[%?](?:(?!php))[%_=-]?)\\s*((/\\*)(.*)(\\*/))(?=(\\s*([%?]>)))",
      captures: {
        1: {
          name: "keyword.operator.relational.js",
        },
        3: {
          name: "punctuation.definition.comment.ejs",
        },
        5: {
          name: "punctuation.definition.comment.ejs",
        },
        2: {
          name: "comment.block.ejs",
        },
      },
      end: "([%?]>)",
      endCaptures: {
        1: {
          name: "keyword.operator.relational.js",
        },
      },
      contentName: "comment.block.ejs",
      name: "meta.block.single.comment.ejs",
    },
    "tag-section-comment": {
      name: "comment.block.ejs",
      begin: "(<[%?](?:(?!php)))\\s*((?=(/\\*)))",
      beginCaptures: {
        1: {
          name: "keyword.operator.relational.js",
        },
      },
      end: "(\\*/)\\s*([%?]>)",
      endCaptures: {
        1: {
          name: "punctuation.definition.comment.ejs",
        },
        2: {
          name: "keyword.operator.relational.js",
        },
      },
      patterns: [
        {
          name: "ejs-end-tag",
          match: "([%?]>)",
          captures: {
            1: {
              name: "keyword.operator.relational.js",
            },
          },
        },
        {
          name: "ejs-begin-tag",
          match: "(<[%?](?:(?!php)))",
          captures: {
            1: {
              name: "keyword.operator.relational.js",
            },
          },
        },
        {
          include: "text.html.ejs",
        },
      ],
    },
    "tag-ejs-single-line": {
      name: "meta.tag.metadata.script.ejs",
      begin:
        "(<[%?](?:(?!php))[%_=-]?)(?!(\\s*\\*/))(((?!([_-]?[%?]>)).)+)(?=([_-]?[%?]>))",
      beginCaptures: {
        0: {
          contentName: "source.js",
          name: "meta.embedded.*",
        },
        1: {
          name: "keyword.operator.relational.js",
        },
        3: {
          name: "meta.embedded.ejs",
          contentName: "source.js",
          patterns: [
            {
              include: "source.js",
            },
          ],
        },
        6: {
          name: "keyword.operator.relational.js",
        },
      },
      end: "(([_-]?[%?]>))",
      endCaptures: {
        1: {
          name: "keyword.operator.relational.js",
        },
      },
    },
    "tag-ejs-multi-line": {
      contentName: "source.js",
      name: "meta.block.ejs",
      begin: "(<[%?](?:(?!php))[%_=-]?)(?!(\\s*\\*/))",
      beginCaptures: {
        1: {
          name: "keyword.operator.relational.js",
        },
        3: {
          name: "meta.embedded.ejs",
          contentName: "source.js",
          patterns: [
            {
              include: "source.js",
            },
          ],
        },
      },
      end: "(([_-]?[%?]>))",
      endCaptures: {
        1: {
          name: "keyword.operator.relational.js",
        },
      },
      patterns: [
        {
          include: "source.js",
        },
      ],
    },
  },
};
