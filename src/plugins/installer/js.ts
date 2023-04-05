import type * as ESTree from "estree";
import type { InstallPluginResult, Plugin } from "..";
import { alertAndLog } from "./error";

export async function installPluginForCJS(
  configText: string,
  plugin: Plugin
): Promise<InstallPluginResult> {
  // @ts-expect-error -- Missing type
  const espree = await import("espree");
  const insertList: { index: number; text: string }[] = [];
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
  configText: string,
  _plugin: Plugin
): Promise<InstallPluginResult> {
  // @ts-expect-error -- Missing type
  const espree = await import("espree");
  // const insertList: { index: number; text: string }[] = [];
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

    const exportDefault = ast.body.find(
      (node) => node.type === "ExportDefaultDeclaration"
    );
    if (!exportDefault) {
      alertAndLog("Unknown `export default`. Failed to add new configuration.");
      return { error: true };
    }
    alertAndLog("Unsupported for MJS. Failed to add new configuration.");
    return { error: true };
    // const right = exportDefault.expression.right;
    // if (!right || right.type !== "ObjectExpression") {
    //   alertAndLog("Unknown exports. Failed to add new configuration.");
    //   return configText;
    // }
    // if (plugin.eslintConfig.plugins) {
    //   insertList.push(
    //     ...addToArray(right, "plugins", [
    //       ...new Set(plugin.eslintConfig.plugins),
    //     ])
    //   );
    // }
    // if (plugin.eslintConfig.extends) {
    //   insertList.push(
    //     ...addToArray(right, "extends", [
    //       ...new Set(plugin.eslintConfig.extends),
    //     ])
    //   );
    // }

    // let newText = "";
    // let start = 0;
    // for (const ins of insertList.sort((a, b) => a.index - b.index)) {
    //   newText += configText.slice(start, ins.index) + ins.text;
    //   start = ins.index;
    // }
    // newText += configText.slice(start);

    // return newText;
  } catch (e) {
    // eslint-disable-next-line no-console -- ignore
    console.error(e);
    alertAndLog("Failed to parse CJS. Failed to add new configuration.");
    return { error: true };
  }
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
): Iterable<{ index: number; text: string }> {
  const target = node.properties.find(
    (p): p is ESTree.Property =>
      p.type === "Property" &&
      ((!p.computed && p.key.type === "Identifier" && p.key.name === key) ||
        (p.key.type === "Literal" && p.key.value === key))
  );
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
  } else if (!target.value || target.value.type !== "ArrayExpression") {
    throw new Error(`Unknown '${key}' value. Failed to add new configuration.`);
  }
  const array = target.value;
  const insertValues = values.filter(
    (val) =>
      !array.elements.some((e) => e && e.type === "Literal" && e.value === val)
  );
  if (insertValues.length) {
    const lastElement = array.elements.findLast((e) => e);
    const indentElement = " ".repeat(
      lastElement ? lastElement.loc!.start.column : array.loc!.start.column + 2
    );
    yield {
      index: lastElement?.range![1] ?? array.range![0] + 1,
      text: `${array.elements.length ? "," : ""}\n${indentElement}${insertValues
        .map((s) => JSON.stringify(s))
        .join(`,\n${indentElement}`)}`,
    };
  }
}
