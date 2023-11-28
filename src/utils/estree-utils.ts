import type * as ESTree from "estree";
import type * as eslintUtils from "eslint-utils";
import type { ScopeManager } from "eslint-scope";
type ESLintUtils = typeof eslintUtils;

export function isModuleExports(
  node: ESTree.Node,
): node is ESTree.ExpressionStatement & {
  expression: ESTree.AssignmentExpression & {
    left: ESTree.MemberExpression & {
      object: ESTree.Identifier & {
        name: "module";
      };
      property: ESTree.Identifier & { name: "exports" };
    };
  };
} {
  return (
    node.type === "ExpressionStatement" &&
    node.expression.type === "AssignmentExpression" &&
    node.expression.left.type === "MemberExpression" &&
    node.expression.left.object.type === "Identifier" &&
    node.expression.left.object.name === "module" &&
    node.expression.left.property.type === "Identifier" &&
    node.expression.left.property.name === "exports"
  );
}

export function toESExpression(object: any): ESTree.Expression {
  if (!object || typeof object !== "object") {
    return {
      type: "Literal",
      value: object,
    };
  }
  if (Array.isArray(object)) {
    return {
      type: "ArrayExpression",
      elements: object.map(toESExpression),
    };
  }
  return {
    type: "ObjectExpression",
    properties: Object.entries(object).map(([k, v]): ESTree.Property => {
      const expr = toESExpression(v);
      return {
        type: "Property",
        kind: "init",
        computed: false,
        key: /^\w+$/u.test(k)
          ? {
              type: "Identifier",
              name: k,
            }
          : {
              type: "Literal",
              value: k,
            },
        value: expr,
        method: false,
        shorthand: false,
      };
    }),
  };
}

export async function toValueFromESExpression(
  object: ESTree.Expression,
  scopeManager: ScopeManager,
): Promise<unknown> {
  const eslintUtils: ESLintUtils = await import(
    // @ts-expect-error -- ignore
    "@eslint-community/eslint-utils"
  );
  const result = eslintUtils.getStaticValue(object, scopeManager.globalScope);
  if (result) {
    return result.value;
  }
  return undefined;
}

export async function analyzeScope(
  program: ESTree.Program,
): Promise<ScopeManager> {
  const { analyze } = await import("eslint-scope");

  return analyze(program, {
    ecmaVersion: Infinity,
    sourceType: "module",
  });
}
