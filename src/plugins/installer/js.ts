import type * as ESTree from "estree";
import type { InstallPluginResult, Plugin } from "..";
import { alertAndLog } from "./error";
import type * as CodeRead from "code-red";

export async function installPluginForCJS(
  configText: string,
  plugin: Plugin
): Promise<InstallPluginResult> {
  const codeRead = await import("code-red");
  try {
    const ast: ESTree.Program = codeRead.parse(configText, {
      ecmaVersion: "latest",
      ranges: true,
      locations: true,
      sourceType: "module",
      allowReturnOutsideFunction: true,
    }) as never;

    const commonJsExports = ast.body.find(isModuleExports);
    if (!commonJsExports) {
      alertAndLog("Unknown exports. Failed to add new configuration.");
      return { error: true };
    }
    const right = commonJsExports.expression.right;
    if (!right || right.type !== "ObjectExpression") {
      alertAndLog("Unknown exports. Failed to add new configuration.");
      return { error: true };
    }
    if (plugin.eslintConfig.plugins) {
      addToArray(codeRead, right, "plugins", [
        ...new Set(plugin.eslintConfig.plugins),
      ]);
    }
    if (plugin.eslintConfig.extends) {
      addToArray(codeRead, right, "extends", [
        ...new Set(plugin.eslintConfig.extends),
      ]);
    }
    if (plugin.eslintConfig.overrides) {
      margeOverride(codeRead, right, plugin.eslintConfig.overrides);
    }

    return { text: codeRead.print(ast).code };
  } catch (e) {
    // eslint-disable-next-line no-console -- ignore
    console.error(e);
    alertAndLog("Failed to parse CJS. Failed to add new configuration.");
    return { error: true };
  }
}

export async function installPluginForMJS(
  _configText: string,
  _plugin: Plugin
): Promise<InstallPluginResult> {
  await Promise.resolve();
  alertAndLog(
    "Flat Config is not yet supported. Failed to add new configuration."
  );
  return { error: true };
}

function isModuleExports(
  node: ESTree.Node
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

function addToArray(
  codeRead: typeof CodeRead,
  node: ESTree.ObjectExpression,
  key: string,
  values: string[]
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
      value: toExpression(codeRead, values),
      method: false,
      shorthand: false,
    });
    return;
  }
  if (target.value.type === "ArrayExpression") {
    const array = target.value;
    const insertValues = values.filter(
      (val) =>
        !array.elements.some(
          (e) => e && e.type === "Literal" && e.value === val
        )
    );
    for (const value of insertValues) {
      array.elements.push(toExpression(codeRead, value));
    }
    return;
  }
  if (target.value.type === "Literal") {
    const newValues = [...new Set([target.value.value, ...values])];
    target.value = toExpression(codeRead, newValues);
    return;
  }
  target.value = toFlatArray(codeRead, target.value, values);
}

function margeOverride(
  codeRead: typeof CodeRead,
  node: ESTree.ObjectExpression,
  overrides: {
    files: string[];
    parser?: string;
  }[]
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
      value: toExpression(codeRead, overrides),
      method: false,
      shorthand: false,
    });
    return;
  }
  if (overridesProperty.value.type !== "ArrayExpression") {
    overridesProperty.value = toFlatArray(
      codeRead,
      overridesProperty.value,
      overrides
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
                  e?.type === "Literal" ? e.value : null
                )
              : null;

          if (JSON.stringify(nodeValue) !== JSON.stringify(value)) {
            return false;
          }
        }

        return true;
      }
    );
    if (target) {
      continue;
    }
    overridesProperty.value.elements.push(toExpression(codeRead, override));
  }
}

function buildPropMatch(name: string) {
  return (
    p: ESTree.Property | ESTree.SpreadElement
  ): p is ESTree.Property & { value: ESTree.Expression } =>
    p.type === "Property" &&
    ((!p.computed && p.key.type === "Identifier" && p.key.name === name) ||
      (p.key.type === "Literal" && p.key.value === name));
}

function toFlatArray(
  codeRead: typeof CodeRead,
  element: ESTree.Expression,
  values: any[]
): ESTree.Expression {
  if (element.type === "ArrayExpression") {
    const array: ESTree.ArrayExpression = {
      type: "ArrayExpression",
      elements: [
        ...flatten(element.elements),
        ...values.map((v) => toExpression(codeRead, v)),
      ],
    };
    return array;
  }
  let elements: (ESTree.Expression | ESTree.SpreadElement)[];
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
  elements = [...flatten(elements)];
  const array: ESTree.ArrayExpression = {
    type: "ArrayExpression",
    elements: [...elements, ...values.map((v) => toExpression(codeRead, v))],
  };
  if (elements.every((n) => n.type === "Literal")) {
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
    nodes: (ESTree.Expression | ESTree.SpreadElement | null)[]
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
}

function toExpression(
  codeRead: typeof CodeRead,
  object: any
): ESTree.Expression {
  if (!object || typeof object !== "object") {
    return codeRead.x`${JSON.stringify(object, null, 2)}`;
  }
  if (Array.isArray(object)) {
    return {
      type: "ArrayExpression",
      elements: object.map((v) => toExpression(codeRead, v)),
    };
  }
  return {
    type: "ObjectExpression",
    properties: Object.entries(object).map(([k, v]): ESTree.Property => {
      const expr = toExpression(codeRead, v);
      return {
        type: "Property",
        kind: "init",
        computed: false,
        key: {
          type: "Identifier",
          name: k,
        },
        value: expr,
        method: false,
        shorthand: false,
      };
    }),
  };
}
