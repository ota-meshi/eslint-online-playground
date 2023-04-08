import type * as ESTree from "estree";
import type * as Yaml from "yaml";
import type { ConfigFileName } from "../utils/eslint-info";
import {
  isModuleExports,
  toValueFromESExpression,
  toESExpression,
  analyzeScope,
} from "../utils/estree-utils";
import { toYAMLContent } from "../utils/yaml-utils";
import type * as _eslintUtils from "eslint-utils";
type ESLintUtils = typeof _eslintUtils;

export async function transformConfigFormat(
  configText: string,
  from: ConfigFileName,
  to: ConfigFileName
): Promise<Promise<string> | string> {
  if (from === to) return configText;
  try {
    // From JSON
    if (from === ".eslintrc.json" && to === ".eslintrc.js") {
      return await transformJsonToCjs(configText);
    }
    if (from === ".eslintrc.json" && to === ".eslintrc.yaml") {
      return configText;
    }

    // From CJS
    if (from === ".eslintrc.js" && to === ".eslintrc.json") {
      return await transformCjsToJson(configText);
    }
    if (from === ".eslintrc.js" && to === ".eslintrc.yaml") {
      return await transformCjsToYaml(configText);
    }

    // From YAML
    if (from === ".eslintrc.yaml" && to === ".eslintrc.json") {
      return await transformYamlToJson(configText);
    }
    if (from === ".eslintrc.yaml" && to === ".eslintrc.js") {
      return await transformYamlToCjs(configText);
    }
  } catch (e) {
    console.log("Transform Error", e);
  }
  return configText;
}

async function transformCjsToJson(configText: string) {
  const codeRead = await import("code-red");
  const ast: ESTree.Program = codeRead.parse(configText, {
    ecmaVersion: "latest",
    ranges: true,
    locations: true,
    sourceType: "module",
    allowReturnOutsideFunction: true,
  }) as never;

  const scopeManager = await analyzeScope(ast);

  const exportNode = ast.body.find(isModuleExports);
  if (exportNode) {
    const value = await toValueFromESExpression(
      exportNode.expression.right,
      scopeManager
    );
    if (value !== undefined) {
      return JSON.stringify(value, null, 2);
    }
  }
  return configText;
}

async function transformCjsToYaml(configText: string) {
  const codeRead = await import("code-red");
  const yaml = await import("yaml");
  const ast: ESTree.Program = codeRead.parse(configText, {
    ecmaVersion: "latest",
    ranges: true,
    locations: true,
    sourceType: "module",
    allowReturnOutsideFunction: true,
  }) as never;

  const exportNode = ast.body.find(isModuleExports);
  if (exportNode) {
    const value = await jsExpressionToYaml(
      yaml,
      exportNode.expression.right,
      ast
    );
    if (value != null) {
      const doc = new yaml.Document(value);
      return doc.toString();
    }
  }
  return configText;
}

async function transformYamlToJson(configText: string) {
  const yaml = await import("yaml");

  return JSON.stringify(yaml.parse(configText), null, 2);
}

async function transformYamlToCjs(configText: string) {
  const yaml = await import("yaml");
  const codeRead = await import("code-red");

  const ast = yaml.parseDocument(configText);

  return `module.exports = ${
    codeRead.print(yamlToJsExpression(yaml, ast.contents)).code
  }`;
}

async function transformJsonToCjs(configText: string) {
  const parsed = JSON.parse(configText);
  const codeRead = await import("code-red");
  return `module.exports = ${codeRead.print(toESExpression(parsed)).code}`;
}

async function jsExpressionToYaml(
  yaml: typeof Yaml,
  node: ESTree.Expression | null,
  program: ESTree.Program
): Promise<
  | Yaml.Scalar
  | Yaml.YAMLMap<Yaml.Node, Yaml.Node>
  | Yaml.YAMLSeq<Yaml.Node>
  | null
> {
  const scopeManager = await analyzeScope(program);
  const eslintUtils: ESLintUtils = await import(
    // @ts-expect-error -- ignore
    "@eslint-community/eslint-utils"
  );

  return toYaml(node);

  async function toYaml(
    node: ESTree.Expression | null
  ): Promise<
    | Yaml.Scalar
    | Yaml.YAMLMap<Yaml.Node, Yaml.Node>
    | Yaml.YAMLSeq<Yaml.Node>
    | null
  > {
    if (node == null) {
      return toYAMLContent(yaml, null);
    }
    if (node.type === "ArrayExpression") {
      const seq = new yaml.YAMLSeq<Yaml.Node>();
      attachComments(seq, node);
      for (const e of node.elements) {
        if (e?.type === "SpreadElement") return null;
        const yNode = await toYaml(e);
        if (!yNode) {
          return null;
        }
        seq.add(yNode);
      }
      return seq;
    }
    if (node.type === "ObjectExpression") {
      const map = new yaml.YAMLMap<Yaml.Node, Yaml.Node>();
      attachComments(map, node);
      for (const prop of node.properties) {
        if (prop.type !== "Property") {
          return null;
        }
        const keyValue = eslintUtils.getPropertyName(
          prop,
          scopeManager.globalScope
        );
        if (keyValue == null) return null;
        const keyNode = toYAMLContent(yaml, keyValue);
        attachComments(keyNode, prop);
        attachComments(keyNode, prop.key);

        const valueNode = await toYaml(prop.value as ESTree.Expression);
        if (!valueNode) return null;

        map.set(keyNode, valueNode);
      }
      return map;
    }
    const content = toYAMLContent(
      yaml,
      await toValueFromESExpression(node, scopeManager)
    );
    attachComments(content, node);
    return content;
  }

  function attachComments(yamlNode: Yaml.Node, esNode: ESTree.Node): void {
    if (esNode.leadingComments)
      yamlNode.commentBefore =
        (yamlNode.commentBefore || "") +
        esNode.leadingComments.map((c) => c.value).join("\n");
    if (esNode.trailingComments)
      yamlNode.comment =
        (yamlNode.comment || "") +
        esNode.trailingComments.map((c) => c.value).join("\n");
  }
}

function yamlToJsExpression(
  yaml: typeof Yaml,
  node: Yaml.ParsedNode | null
): ESTree.Expression {
  if (node == null) {
    return { type: "Literal", value: null };
  }
  if (yaml.isScalar(node)) {
    return {
      type: "Literal",
      value: node.value as any,
      ...comments(node),
    };
  }
  if (yaml.isSeq(node)) {
    return {
      type: "ArrayExpression",
      elements: node.items.map((item) => yamlToJsExpression(yaml, item)),
      ...comments(node),
    };
  }
  if (yaml.isMap(node)) {
    return {
      type: "ObjectExpression",
      properties: node.items.map((item): ESTree.Property => {
        const key = yamlToJsExpression(yaml, item.key);
        const value = yamlToJsExpression(yaml, item.value);
        return {
          type: "Property",
          key:
            key.type === "Literal"
              ? {
                  type: "Identifier",
                  name: String(key.value),
                  leadingComments: key.leadingComments,
                  trailingComments: key.trailingComments,
                }
              : key,
          value,
          computed: key.type !== "Literal",
          method: false,
          shorthand: false,
          kind: "init",
        };
      }),
      ...comments(node),
    };
  }

  return toESExpression(node.toJSON());

  function comments(n: Yaml.ParsedNode) {
    const leadingComments = (n.commentBefore ?? "").trimEnd();
    const trailingComments = (n.comment ?? "").trimEnd();
    return {
      leadingComments: leadingComments
        ? [
            leadingComments.includes("\n")
              ? {
                  type: "Block" as const,
                  value: leadingComments,
                }
              : {
                  type: "Line" as const,
                  value: `${leadingComments}\n`,
                },
          ]
        : undefined,
      trailingComments: trailingComments
        ? [
            trailingComments.includes("\n")
              ? {
                  type: "Block" as const,
                  value: trailingComments,
                }
              : {
                  type: "Line" as const,
                  value: `${trailingComments}\n`,
                },
          ]
        : undefined,
    };
  }
}
