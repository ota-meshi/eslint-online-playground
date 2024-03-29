export function isRepoEnvFile(fileName: string): boolean {
  if (
    // Repository documentations
    /^(?:readme|changelog|contributing|code_of_conduct)(?:\.[a-z]+)*\.md$/iu.test(
      fileName,
    ) ||
    /^license(?:\.[a-z]+)?$/iu.test(fileName)
  )
    return true;

  if (fileName.startsWith(".") && !fileName.includes("/")) return true; // Dot files
  return (
    // Maybe config file
    fileName.includes(".config.") &&
    (fileName.endsWith(".js") ||
      fileName.endsWith(".cjs") ||
      fileName.endsWith(".mjs") ||
      fileName.endsWith(".ts") ||
      fileName.endsWith(".cts") ||
      fileName.endsWith(".mts"))
  );
}
