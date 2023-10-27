export function customCompare(a: string, b: string): number {
  return normalize(a).localeCompare(normalize(b));

  function normalize(s: string) {
    return s.toLowerCase().replace(/[^01A-Za-z]+/u, "");
  }
}
