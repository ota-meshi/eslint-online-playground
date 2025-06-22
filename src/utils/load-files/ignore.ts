export function ignore(filePath: string): boolean {
  return (
    // Ignore .github, .vscode, .devcontainer
    // and binary files
    filePath.startsWith(".github/") ||
    filePath.startsWith(".vscode/") ||
    filePath.startsWith(".devcontainer/") ||
    maybeBinaryFile(filePath)
  );
}

function maybeBinaryFile(filePath: string): boolean {
  const EXTS = [
    ".3g2",
    ".3gp",
    ".aac",
    ".aac",
    ".apng",
    ".avif",
    ".bmp",
    ".cur",
    ".flac",
    ".flac",
    ".gif",
    ".ico",
    ".jfif",
    ".jpeg",
    ".jpg",
    ".m1a",
    ".m1v",
    ".m2a",
    ".m2v",
    ".m4p",
    ".mov",
    ".mp1",
    ".mp2",
    ".mp3",
    ".mp4",
    ".mpa",
    ".mpe",
    ".mpeg",
    ".mpg",
    ".mpv",
    ".oga",
    ".ogg",
    ".ogm",
    ".ogv",
    ".ogx",
    ".opus",
    ".pjp",
    ".pjpeg",
    ".png",
    ".spx",
    ".tif",
    ".tiff",
    ".ttf",
    ".wav",
    ".webm",
    ".webp",
    ".woff",
    ".woff2",
  ];
  return EXTS.some((ext) => filePath.endsWith(ext));
}
