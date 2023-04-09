export function prettyStringify(object: any): string {
  return toLines(object).join("\n");
}

function toLines(object: any): string[] {
  if (!object || typeof object !== "object") {
    return [JSON.stringify(object)];
  }
  if (Array.isArray(object)) {
    return toLinesObject("[", "]", object.map(toLines));
  }
  return toLinesObject(
    "{",
    "}",
    Object.entries(object).map(([k, v]): string[] => {
      const vs = toLines(v);
      return [`${JSON.stringify(k)}: ${vs[0]}`, ...vs.slice(1)];
    })
  );
}

function toLinesObject(
  open: string,
  close: string,
  elements: string[][]
): string[] {
  const first = elements[0];
  if (!first) {
    return [open + close];
  }
  if (first.length > 1) {
    return toLinesWithLineFeed();
  }
  let line = first[0];
  for (const element of elements.slice(1)) {
    if (element.length > 1) {
      return toLinesWithLineFeed();
    }
    line += `, ${element[0]}`;
  }
  line = open + line + close;
  if (line.length > 40) {
    return toLinesWithLineFeed();
  }
  return [line];

  function toLinesWithLineFeed() {
    const result = [open];
    elements.forEach((lines, i) => {
      const lastElement = elements.length - 1 === i;
      lines.forEach((line, i) => {
        const lastLine = lines.length - 1 === i;
        result.push(`  ${line}${!lastElement && lastLine ? "," : ""}`);
      });
    });
    result.push(close);
    return result;
  }
}
