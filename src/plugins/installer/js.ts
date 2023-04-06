import type * as ESTree from "estree";
import type { InstallPluginResult, Plugin } from "..";
import { alertAndLog } from "./error";

type InsertText = { index: number; text: string };
export async function installPluginForCJS(
  configText: string,
  plugin: Plugin
): Promise<InstallPluginResult> {
  // @ts-expect-error -- Missing type
  const espree = await import("espree");
  const insertList: InsertText[] = [];
  try {
    const ast: ESTree.Program = espree.parse(configText, {
      ecmaVersion: "latest",
      range: true,
      loc: true,
      sourceType: "module",
      ecmaFeatures: {
        globalReturn: true,
      },
    });

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
      insertList.push(
        ...addToArray(right, "plugins", [
          ...new Set(plugin.eslintConfig.plugins),
        ])
      );
    }
    if (plugin.eslintConfig.extends) {
      insertList.push(
        ...addToArray(right, "extends", [
          ...new Set(plugin.eslintConfig.extends),
        ])
      );
    }
    if (plugin.eslintConfig.overrides) {
      insertList.push(...margeOverride(right, plugin.eslintConfig.overrides));
    }

    let newText = "";
    let start = 0;
    for (const ins of insertList.sort((a, b) => a.index - b.index)) {
      newText += configText.slice(start, ins.index) + ins.text;
      start = ins.index;
    }
    newText += configText.slice(start);

    return { text: newText };
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

function* addToArray(
  node: ESTree.ObjectExpression,
  key: string,
  values: string[]
): Iterable<InsertText> {
  const target = node.properties.find(buildPropMatch(key));
  if (!target) {
    const lastProp = node.properties[node.properties.length - 1];
    const indentProp = " ".repeat(
      lastProp ? lastProp.loc!.start.column : node.loc!.start.column + 2
    );
    yield {
      index: lastProp?.range![1] ?? node.range![0] + 1,
      text: `${
        node.properties.length ? "," : ""
      }\n${indentProp}${key}: [\n${indentProp}  ${values
        .map((s) => JSON.stringify(s))
        .join(`,\n${indentProp}  `)}\n${indentProp}]`,
    };
    return;
  }
  if (target.value.type === "Literal") {
    const literal = target.value;
    yield {
      index: target.value.range![0],
      text: "[",
    };
    const insertValues = values.filter((val) => literal.value === val);
    yield {
      index: target.value.range![1],
      text: `, ${insertValues.map((s) => JSON.stringify(s)).join(`, `)}]`,
    };
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
    if (insertValues.length) {
      const lastElement = array.elements.findLast((e) => e);
      const indentElement = " ".repeat(
        lastElement
          ? lastElement.loc!.start.column
          : array.loc!.start.column + 2
      );
      yield {
        index: lastElement?.range![1] ?? array.range![0] + 1,
        text: `${
          array.elements.length ? "," : ""
        }\n${indentElement}${insertValues
          .map((s) => JSON.stringify(s))
          .join(`,\n${indentElement}`)}`,
      };
    }
    return;
  }

  throw new Error(`Unknown '${key}' value. Failed to add new configuration.`);
}

function* margeOverride(
  node: ESTree.ObjectExpression,
  overrides: {
    files: string[];
    parser?: string;
  }[]
): Iterable<InsertText> {
  const overridesProperty = node.properties.find(buildPropMatch("overrides"));
  if (!overridesProperty) {
    const lastProp = node.properties[node.properties.length - 1];
    const indentProp = " ".repeat(
      lastProp ? lastProp.loc!.start.column : node.loc!.start.column + 2
    );
    const valueText = jsonText(indentProp, overrides);
    yield {
      index: lastProp?.range![1] ?? node.range![0] + 1,
      text: `${
        node.properties.length ? "," : ""
      }\n${indentProp}overrides: ${valueText}`,
    };
    return;
  }
  const indentProp = " ".repeat(overridesProperty.loc!.start.column);
  if (overridesProperty.value.type !== "ArrayExpression") {
    const valueText = jsonText(indentProp, overrides);
    yield {
      index: overridesProperty.value.range![0],
      text: `[\n${indentProp}  ...`,
    };
    yield {
      index: overridesProperty.value.range![1],
      text: valueText.slice(1),
    };
    return;
  }
  const array = overridesProperty.value;

  const remainingOverrides: {
    files: string[];
    parser?: string;
  }[] = [];
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
    if (!target) {
      remainingOverrides.push(override);
    }
  }
  if (remainingOverrides.length === 0) {
    return;
  }
  const lastElement = array.elements.findLast((e) => e);
  const valueText = jsonText(indentProp, remainingOverrides);
  yield {
    index: lastElement?.range![1] ?? array.range![0] + 1,
    text: `${lastElement ? "," : ""}${valueText.slice(1, -1).trimEnd()}`,
  };

  function jsonText(indent: string, object: any) {
    const lines = JSON.stringify(object, null, 2).split("\n");
    if (lines.length <= 1) {
      return lines.join("\n");
    }
    return [
      ...lines.slice(0, 1),
      ...lines.slice(1).map((line) => indent + line),
    ].join("\n");
  }
}

function buildPropMatch(name: string) {
  return (p: ESTree.Property | ESTree.SpreadElement): p is ESTree.Property =>
    p.type === "Property" &&
    ((!p.computed && p.key.type === "Identifier" && p.key.name === name) ||
      (p.key.type === "Literal" && p.key.value === name));
}
