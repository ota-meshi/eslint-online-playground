import type * as ESTree from "estree";
import type { ConfigInstallPluginResult, Plugin } from "..";
import { alertAndLog } from "./error";
import { isModuleExports, toESExpression } from "../../utils/estree-utils";

export async function installPluginForCJS(
  configText: string,
  plugins: Plugin[],
): Promise<ConfigInstallPluginResult> {
  const codeRead = await import("code-red");
  try {
    const ast: ESTree.Program = codeRead.parse(configText, {
      ecmaVersion: "latest",
      ranges: true,
      locations: true,
      sourceType: "module",
      allowReturnOutsideFunction: true,
    }) as never;

    let commonJsExports = ast.body.find(isModuleExports);
    if (!commonJsExports) {
      commonJsExports = {
        type: "ExpressionStatement",
        expression: {
          type: "AssignmentExpression",
          left: {
            type: "MemberExpression",
            object: {
              type: "Identifier",
              name: "module",
            },
            computed: false,
            property: {
              type: "Identifier",
              name: "exports",
            },
            optional: false,
          },
          operator: "=",
          right: {
            type: "ObjectExpression",
            properties: [],
          },
        },
      };
      ast.body.push(commonJsExports);
    }
    let targetNode = commonJsExports.expression.right;

    if (targetNode.type !== "ObjectExpression") {
      targetNode = commonJsExports.expression.right = {
        type: "ObjectExpression",
        properties: [
          {
            type: "SpreadElement",
            argument: targetNode,
          },
        ],
      };
    }

    for (const plugin of plugins) {
      if (!plugin.eslintLegacyConfig) {
        alertAndLog(
          "Contains plugins that do not support legacy configurations.",
        );
        return { error: true };
      }
      for (const key of ["plugins", "extends"] as const) {
        const values = plugin.eslintLegacyConfig[key];
        if (values) {
          addToArray(targetNode, key, values);
        }
      }
      if (plugin.eslintLegacyConfig.overrides) {
        margeOverride(targetNode, plugin.eslintLegacyConfig.overrides);
      }
    }

    return { configText: codeRead.print(ast).code };
  } catch (e) {
    // eslint-disable-next-line no-console -- ignore
    console.error(e);
    alertAndLog("Failed to parse CJS. Failed to add new configuration.");
    return { error: true };
  }
}

function addToArray(
  node: ESTree.ObjectExpression,
  key: string,
  values: string[],
): void {
  const target = node.properties.find(buildPropMatch(key));
  if (!target) {
    node.properties.push({
      type: "Property",
      kind: "init",
      computed: false,
      key: {
        type: "Identifier",
        name: key,
      },
      value: toESExpression(values),
      method: false,
      shorthand: false,
    });
    return;
  }
  target.value = toFlatDistinctArray(target.value, values);
}

function margeOverride(
  node: ESTree.ObjectExpression,
  overrides: {
    files: string[];
    parser?: string;
  }[],
): void {
  const overridesProperty = node.properties.find(buildPropMatch("overrides"));
  if (!overridesProperty) {
    node.properties.push({
      type: "Property",
      kind: "init",
      computed: false,
      key: {
        type: "Identifier",
        name: "overrides",
      },
      value: toESExpression(overrides),
      method: false,
      shorthand: false,
    });
    return;
  }
  if (overridesProperty.value.type !== "ArrayExpression") {
    overridesProperty.value = toFlatDistinctArray(
      overridesProperty.value,
      overrides,
    );
    return;
  }
  const array = overridesProperty.value;

  for (const override of overrides) {
    const target = array.elements.find(
      (element): element is ESTree.ObjectExpression => {
        if (element?.type !== "ObjectExpression") {
          return false;
        }
        for (const [key, value] of Object.entries(override)) {
          const property = element.properties.find(buildPropMatch(key));
          if (!property) {
            return false;
          }
          const nodeValue =
            property.value.type === "Literal"
              ? property.value.value
              : property.value.type === "ArrayExpression"
                ? property.value.elements.map((e) =>
                    e?.type === "Literal" ? e.value : null,
                  )
                : null;

          if (JSON.stringify(nodeValue) !== JSON.stringify(value)) {
            return false;
          }
        }

        return true;
      },
    );
    if (target) {
      continue;
    }
    overridesProperty.value.elements.push(toESExpression(override));
  }
}

function buildPropMatch(name: string) {
  return (
    p: ESTree.Property | ESTree.SpreadElement,
  ): p is ESTree.Property & { value: ESTree.Expression } =>
    p.type === "Property" &&
    ((!p.computed && p.key.type === "Identifier" && p.key.name === name) ||
      (p.key.type === "Literal" && p.key.value === name));
}

function toFlatDistinctArray(
  element: ESTree.Expression,
  values: any[],
): ESTree.Expression {
  if (element.type === "ArrayExpression") {
    const array: ESTree.ArrayExpression = {
      type: "ArrayExpression",
      elements: distinct([
        ...flatten(element.elements),
        ...values.map(toESExpression),
      ]),
    };
    return array;
  }
  let elements: Iterable<ESTree.Expression | ESTree.SpreadElement>;
  if (
    element.type === "CallExpression" &&
    element.callee.type === "MemberExpression" &&
    !element.callee.computed &&
    element.callee.property.type === "Identifier" &&
    element.callee.property.name === "flat" &&
    element.callee.object.type !== "Super"
  ) {
    elements = [element.callee.object];
  } else {
    elements = [element];
  }
  elements = flatten(elements);
  const array: ESTree.ArrayExpression = {
    type: "ArrayExpression",
    elements: distinct([...elements, ...values.map(toESExpression)]),
  };
  if (array.elements.every((n) => n && n.type === "Literal")) {
    return array;
  }
  const member: ESTree.MemberExpression = {
    type: "MemberExpression",
    object: array,
    computed: false,
    property: {
      type: "Identifier",
      name: "flat",
    },
    optional: false,
  };
  const call: ESTree.CallExpression = {
    type: "CallExpression",
    callee: member,
    optional: false,
    arguments: [],
  };
  return call;

  function* flatten(
    nodes: Iterable<ESTree.Expression | ESTree.SpreadElement | null>,
  ): Iterable<ESTree.Expression | ESTree.SpreadElement> {
    for (const node of nodes) {
      if (!node) continue;
      if (node.type === "ArrayExpression") {
        yield* flatten(node.elements);
      } else {
        yield node;
      }
    }
  }

  function distinct(
    nodes: Iterable<ESTree.Expression | ESTree.SpreadElement>,
  ): (ESTree.Expression | ESTree.SpreadElement)[] {
    const map = new Map<any, ESTree.Expression | ESTree.SpreadElement>();
    for (const node of nodes) {
      if (node.type === "Literal") {
        map.set(node.value, node);
      } else {
        map.set(node, node);
      }
    }

    return [...map.values()];
  }
}
