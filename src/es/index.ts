import type * as ESTree from "estree";
import type * as BabelInstance from "@babel/parser";

export type RecastResult<T> = {
  program: T;
};

export async function parse(code: string): Promise<ESTree.Program> {
  return baseParse(
    code,
    (babel, code, options) =>
      babel.parse(code, options).program as ESTree.Program,
  );
}

export async function parseExpression(
  code: string,
): Promise<ESTree.Expression> {
  return baseParse(
    code,
    (babel, code, options) =>
      babel.parseExpression(code, options) as ESTree.Expression,
  );
}

async function baseParse<T>(
  code: string,
  parse: (
    babel: typeof BabelInstance,
    code: string,
    options: BabelInstance.ParserOptions,
  ) => T,
): Promise<T> {
  const babel = await import("@babel/parser");

  const result = parse(babel, code, {
    plugins: ["typescript", "explicitResourceManagement", "estree"],
    sourceType: "module",
    ranges: true,
    allowReturnOutsideFunction: true,
  });

  return result;
}

export async function print(node: ESTree.Node): Promise<string> {
  const esrap = await import("esrap");
  return esrap.print(node, {}).code;
}
