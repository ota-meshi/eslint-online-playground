export function isLockFile(fileName: string): boolean {
  return (
    fileName === "pnpm-lock.yaml" ||
    fileName === "yarn.lock" ||
    fileName === "package-lock.json"
  );
}

export function detectPackageManager(
  rootFiles: string[],
): "npm" | "yarn" | "pnpm" {
  for (const f of rootFiles) {
    if (f === "pnpm-lock.yaml") return "pnpm";
    if (f === "yarn.lock") return "yarn";
  }
  return "npm";
}
