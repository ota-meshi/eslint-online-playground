import type * as ESTree from "estree";
import type {
  BuildESLintConfigHelper,
  ConfigInstallPluginResult,
  Plugin,
} from "..";
import { alertAndLog } from "./error";
import {
  analyzeScope,
  isDirective,
  isExportDefault,
  isModuleExports,
  isRequireDeclaration,
  iterateRequireDeclarator,
} from "../../utils/estree-utils";
import * as es from "../../es/index";

export async function installPluginForFlatConfig(
  configText: string,
  plugins: Plugin[],
): Promise<ConfigInstallPluginResult> {
  try {
    const ast: ESTree.Program = await es.parse(configText);

    let targetNode: ESTree.ArrayExpression;
    let sourceType: "module" | "script" = "module";
    const exportDefault = ast.body.find(isExportDefault);
    if (exportDefault) {
      sourceType = "module";
      const expr = isDefineConfigCall(exportDefault.declaration)
        ? exportDefault.declaration.arguments[0]
        : exportDefault.declaration;
      if (expr.type === "ArrayExpression") {
        targetNode = expr;
      } else {
        targetNode = {
          type: "ArrayExpression",
          elements: [
            {
              type: "SpreadElement",
              argument: expr as any,
            },
          ],
        };
        if (isDefineConfigCall(exportDefault.declaration)) {
          exportDefault.declaration.arguments[0] = targetNode;
        } else {
          exportDefault.declaration = targetNode;
        }
      }
    } else {
      const commonJsExports = ast.body.find(isModuleExports);
      if (commonJsExports) {
        sourceType = "script";
        const expr = isDefineConfigCall(commonJsExports.expression.right)
          ? commonJsExports.expression.right.arguments[0]
          : commonJsExports.expression.right;
        if (expr.type === "ArrayExpression") {
          targetNode = expr;
        } else {
          targetNode = {
            type: "ArrayExpression",
            elements: [
              {
                type: "SpreadElement",
                argument: expr as any,
              },
            ],
          };
          if (isDefineConfigCall(commonJsExports.expression.right)) {
            commonJsExports.expression.right.arguments[0] = targetNode;
          } else {
            commonJsExports.expression.right = targetNode;
          }
        }
      } else {
        alertAndLog(
          "Failed to parse eslint.config.*. Failed to add new configuration.",
        );
        return { error: true };
      }
    }

    const scopeManager = await analyzeScope(ast);
    const usedIds = new Set<string>();
    scopeManager.globalScope.through.forEach((ref) =>
      usedIds.add(ref.identifier.name),
    );
    scopeManager.globalScope.variables.forEach((variable) =>
      usedIds.add(variable.name),
    );
    scopeManager.globalScope.childScopes
      .find((s) => s.type === "module")
      ?.variables.forEach((variable) => usedIds.add(variable.name));

    const helper: BuildESLintConfigHelper = {
      type: sourceType,
      x(code) {
        return es.parseExpression(code);
      },
      async i(code) {
        const decl = (await es.parse(code)).body[0];

        if (decl?.type === "ImportDeclaration") {
          return decl;
        }
        throw new Error(
          `Failed to parse import declaration: ${JSON.stringify(code)}`,
        );
      },
      async require(def) {
        const decl = (
          await es.parse(
            `import * as ${def.local} from ${JSON.stringify(def.source)}`,
          )
        ).body[0];

        if (decl?.type === "ImportDeclaration") {
          return decl;
        }
        throw new Error(`Failed to parse: ${JSON.stringify(def)}`);
      },
      spread(expression) {
        return {
          type: "SpreadElement",
          argument: expression,
        };
      },
    };

    for (const plugin of plugins) {
      if (!plugin.eslintConfig) {
        alertAndLog("Contains plugins that do not support new configurations.");
        return { error: true };
      }
      const eslintConfig = plugin.eslintConfig;
      const localNames: Record<string, string> = Object.create(null);
      for await (const decl of eslintConfig.imports(helper)) {
        if (sourceType === "module") {
          margeImport(ast.body, decl, localNames, usedIds);
        } else {
          margeRequire(ast.body, decl, localNames, usedIds);
        }
      }
      for await (const element of eslintConfig.expression(localNames, helper)) {
        targetNode.elements.push(element);
      }
    }

    return { configText: await es.print(ast) };
  } catch (e) {
    // eslint-disable-next-line no-console -- ignore
    console.error(e);
    alertAndLog("Failed to parse config. Failed to add new configuration.");
    return { error: true };
  }
}

function skipDefineConfig(
  expr:
    | ESTree.Expression
    | ESTree.MaybeNamedFunctionDeclaration
    | ESTree.MaybeNamedClassDeclaration,
) {
  if (isDefineConfigCall(expr)) {
    return expr.arguments[0];
  }
  return expr;
}

function isDefineConfigCall(
  expr:
    | ESTree.Expression
    | ESTree.MaybeNamedFunctionDeclaration
    | ESTree.MaybeNamedClassDeclaration,
): expr is ESTree.CallExpression {
  return (
    expr.type === "CallExpression" &&
    expr.callee.type === "Identifier" &&
    expr.callee.name === "defineConfig"
  );
}

function margeImport(
  body: (ESTree.Directive | ESTree.Statement | ESTree.ModuleDeclaration)[],
  decl: ESTree.ImportDeclaration,
  localNames: Record<string, string>,
  usedIds: Set<string>,
) {
  for (const spec of decl.specifiers) {
    if (spec.type === "ImportNamespaceSpecifier") {
      const node = findImportAll();
      if (node) {
        localNames[spec.local.name] = node.spec.local.name;
      } else {
        const name = resolveName(spec.local.name, usedIds);
        insertImport({
          type: "ImportDeclaration",
          source: decl.source,
          specifiers: [
            {
              type: "ImportNamespaceSpecifier",
              local: {
                type: "Identifier",
                name,
              },
            },
          ],
        });
        localNames[spec.local.name] = name;
        usedIds.add(name);
      }
    } else if (spec.type === "ImportDefaultSpecifier") {
      const node = findImportDefault();
      if (node) {
        localNames[spec.local.name] = node.spec.local.name;
      } else {
        const name = resolveName(spec.local.name, usedIds);
        insertImport({
          type: "ImportDeclaration",
          source: decl.source,
          specifiers: [
            {
              type: "ImportDefaultSpecifier",
              local: {
                type: "Identifier",
                name,
              },
            },
          ],
        });
        localNames[spec.local.name] = name;
        usedIds.add(name);
      }
    } else {
      const node = findNamedImport(getName(spec.imported));
      if (node) {
        localNames[spec.local.name] = node.spec.local.name;
      } else {
        const name = resolveName(spec.local.name, usedIds);
        insertImport({
          type: "ImportDeclaration",
          source: decl.source,
          specifiers: [
            {
              type: "ImportSpecifier",
              imported: {
                type: "Identifier",
                name: getName(spec.imported),
              },
              local: {
                type: "Identifier",
                name,
              },
            },
          ],
        });
        localNames[spec.local.name] = name;
        usedIds.add(name);
      }
    }
  }

  function findImportAll():
    | { decl: ESTree.ImportDeclaration; spec: ESTree.ImportNamespaceSpecifier }
    | undefined {
    for (const node of iterateImport()) {
      const ns = node.specifiers.find(
        (spec): spec is ESTree.ImportNamespaceSpecifier =>
          spec.type === "ImportNamespaceSpecifier",
      );
      if (ns) {
        return { decl: node, spec: ns };
      }
    }
    return undefined;
  }

  function findImportDefault():
    | { decl: ESTree.ImportDeclaration; spec: ESTree.ImportDefaultSpecifier }
    | undefined {
    for (const node of iterateImport()) {
      const d = node.specifiers.find(
        (spec): spec is ESTree.ImportDefaultSpecifier =>
          spec.type === "ImportDefaultSpecifier",
      );
      if (d) {
        return { decl: node, spec: d };
      }
    }
    return undefined;
  }

  function findNamedImport(
    imported: string,
  ):
    | { decl: ESTree.ImportDeclaration; spec: ESTree.ImportSpecifier }
    | undefined {
    for (const node of iterateImport()) {
      const spec = node.specifiers.find(
        (spec): spec is ESTree.ImportSpecifier =>
          spec.type === "ImportSpecifier" &&
          getName(spec.imported) === imported,
      );
      if (spec) {
        return { decl: node, spec };
      }
    }
    return undefined;
  }

  function* iterateImport(): Iterable<ESTree.ImportDeclaration> {
    for (const node of body) {
      if (
        node.type === "ImportDeclaration" &&
        node.source.value === decl.source.value
      )
        yield node;
    }
  }

  function insertImport(node: ESTree.ImportDeclaration) {
    for (let index = 0; index < body.length; index++) {
      const st = body[index];
      if (st.type === "ImportDeclaration" || isDirective(st)) {
        continue;
      }
      body.splice(index, 0, node);
      return;
    }
    body.push(node);
  }
}

function margeRequire(
  body: (ESTree.Directive | ESTree.Statement | ESTree.ModuleDeclaration)[],
  decl: ESTree.ImportDeclaration,
  localNames: Record<string, string>,
  usedIds: Set<string>,
) {
  let requireNode = findRequire();
  if (!requireNode) {
    requireNode = insertRequireFromSource();
  }
  for (const spec of decl.specifiers) {
    let importedName: string | null;
    if (spec.type === "ImportNamespaceSpecifier") {
      importedName = null;
    } else if (spec.type === "ImportDefaultSpecifier") {
      importedName = "default";
    } else {
      importedName = getName(spec.imported);
    }
    const preferName: string = spec.local.name;
    if (requireNode.type === "Identifier") {
      localNames[preferName] = `${requireNode.name}${
        importedName ? `.${importedName}` : ""
      }`;
    } else if (importedName) {
      const prop = requireNode.properties.find(
        (
          prop,
        ): prop is ESTree.AssignmentProperty & {
          value: ESTree.Identifier;
        } =>
          prop.type === "Property" &&
          !prop.computed &&
          prop.key.type === "Identifier" &&
          prop.key.name === importedName &&
          prop.value.type === "Identifier",
      );
      if (prop) {
        localNames[preferName] = prop.value.name;
      } else {
        const localName = resolveName(preferName, usedIds);
        usedIds.add(localName);
        requireNode.properties.push({
          type: "Property",
          computed: false,
          shorthand: false,
          method: false,
          kind: "init",
          key: {
            type: "Identifier",
            name: importedName,
          },
          value: {
            type: "Identifier",
            name: localName,
          },
        });
        localNames[preferName] = localName;
      }
    } else {
      requireNode = insertRequireFromSource();
      localNames[preferName] = `${requireNode.name}${
        importedName ? `.${importedName}` : ""
      }`;
    }
  }

  function findRequire() {
    for (const node of body) {
      for (const v of iterateRequireDeclarator(node)) {
        const moduleName = v.init.arguments[0];
        if (
          moduleName?.type === "Literal" &&
          moduleName.value === decl.source.value &&
          (v.id.type === "Identifier" || v.id.type === "ObjectPattern")
        ) {
          return v.id;
        }
      }
    }
    return null;
  }

  function insertRequireFromSource() {
    const preferName =
      decl.specifiers.find(
        (spec) =>
          spec.type === "ImportDefaultSpecifier" ||
          spec.type === "ImportNamespaceSpecifier",
      )?.local.name ?? toId(String(decl.source.value).replace(/^eslint-/u, ""));

    const localName = resolveName(preferName, usedIds);
    usedIds.add(localName);
    const id: ESTree.Identifier = {
      type: "Identifier",
      name: localName,
    };
    insertRequire({
      type: "VariableDeclaration",
      kind: "const",
      declarations: [
        {
          type: "VariableDeclarator",
          id,
          init: {
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: "require",
            },
            arguments: [
              {
                type: "Literal",
                value: String(decl.source.value),
              },
            ],
            optional: false,
          },
        },
      ],
    });
    return id;
  }

  function insertRequire(
    node: ESTree.VariableDeclaration & {
      declarations: [
        {
          type: "VariableDeclarator";
          id: ESTree.Identifier;
          init: ESTree.SimpleCallExpression;
        },
      ];
    },
  ): void {
    for (let index = 0; index < body.length; index++) {
      const st = body[index];
      if (isRequireDeclaration(st) || isDirective(st)) {
        continue;
      }
      body.splice(index, 0, node);
      return;
    }
    body.push(node);
  }

  function toId(name: string) {
    return camelCase(name.replace(/\W/giu, "_"));
  }

  function camelCase(str: string) {
    return str
      .replace(/(?:\b|[-_])(\w)/gu, (_, c) => (c ? c.toUpperCase() : ""))
      .replace(/^./u, (c) => c.toLowerCase());
  }
}

function resolveName(name: string, usedIds: Set<string>) {
  let resolved = name;
  while (usedIds.has(resolved)) {
    resolved = `_${resolved}`;
  }
  return resolved;
}

function getName(node: ESTree.Identifier | ESTree.Literal): string {
  return node.type === "Identifier" ? node.name : String(node.value);
}
