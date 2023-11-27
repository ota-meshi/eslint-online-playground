export function maybeTSConfig(fileName: string): boolean {
  return /^tsconfig(?:\.\w+)?\.json$/u.test(fileName);
}
export function maybeNestingTSConfig(fileName: string): boolean {
  return /(?:^|\/|\\)tsconfig(?:\.\w+)?\.json$/u.test(fileName);
}
