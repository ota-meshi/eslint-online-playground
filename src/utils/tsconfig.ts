export function maybeTSConfig(fileName: string): boolean {
  return /^tsconfig(?:\.\w+)?\.json$/u.test(fileName);
}
