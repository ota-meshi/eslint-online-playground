const indentStr = "  ";
export function prettyStringify(object: unknown): string {
  return toLines("", object).join("\n");
}

function toLines(indent: string, object: unknown): string[] {
  if (!object || typeof object !== "object") {
    return [indent + JSON.stringify(object)];
  }
  if (Array.isArray(object)) {
    return toLinesObject(
      indent,
      "[]",
      object.map((element: unknown) => toLines(indent + indentStr, element))
    );
  }
  return toLinesWithLineFeed(
    indent,
    "{}",
    Object.entries(object).map(([k, v]) => {
      const vs = toLines(indent + indentStr, v);
      return [
        `${indent + indentStr}${JSON.stringify(k)}: ${vs[0].trim()}`,
        ...vs.slice(1),
      ];
    })
  );
}

function toLinesObject(
  indent: string,
  parens: string,
  elements: string[][]
): string[] {
  if (elements.some((element) => element.length > 1)) {
    return toLinesWithLineFeed(indent, parens, elements);
  }
  const [open, close] = parens;
  const line =
    indent + open + elements.map(([line]) => line.trim()).join(", ") + close;
  if (line.length > 80) {
    return toLinesWithLineFeed(indent, parens, elements);
  }
  return [line];
}

function toLinesWithLineFeed(
  indent: string,
  [open, close]: string,
  elements: string[][]
) {
  return [
    indent + open,
    ...elements
      .slice(0, -1)
      .flatMap((element) => [
        ...element.slice(0, -1),
        `${element.slice(-1)[0]},`,
      ]),
    ...elements.slice(-1).flat(),
    indent + close,
  ];
}
