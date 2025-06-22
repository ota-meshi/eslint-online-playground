import { loadingWith } from "../loading";

import { strFromU8, unzipSync } from "fflate";
import { ignore } from "./ignore";

export function loadFilesFromZip(file: File): Promise<Record<string, string>> {
  return loadingWith(async () => {
    const buffer = await file.arrayBuffer();
    const decompressed = unzipSync(new Uint8Array(buffer), {
      filter: (f) => !ignore(f.name) && !f.name.endsWith("/"),
    });

    let sameRootPath: string[] | null = null;
    const files: Record<string, string> = {};
    for (const [entry, value] of Object.entries(decompressed)) {
      files[entry] = strFromU8(value);
      const path = entry.split("/").slice(0, -1);
      if (!sameRootPath) {
        sameRootPath = path;
      } else {
        for (let i = 0; i < sameRootPath.length; i++) {
          if (sameRootPath[i] !== path[i]) {
            sameRootPath = sameRootPath.slice(0, i);
            break;
          }
        }
      }
    }

    if (!sameRootPath || sameRootPath.length === 0) {
      return files;
    }
    const adjustedFiles: Record<string, string> = {};
    const rootPath = sameRootPath.join("/");
    for (const key of Object.keys(files)) {
      adjustedFiles[key.slice(rootPath.length + 1)] = files[key];
    }

    return adjustedFiles;
  });
}
