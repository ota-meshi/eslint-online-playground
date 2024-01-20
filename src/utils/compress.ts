import { zlibSync, unzlibSync, strToU8, strFromU8 } from "fflate";

export function compress(data: any): string {
  try {
    return utoa(JSON.stringify(data));
  } catch {
    // return silently
    return "";
  }
}

export function decompress(str: string): unknown | null {
  try {
    const data = JSON.parse(atou(str));

    return typeof data !== "object" || data === null ? {} : data;
  } catch {
    // return silently
    return null;
  }
}

export function utoa(data: string): string {
  const buffer = strToU8(data);
  const zipped = zlibSync(buffer, { level: 9 });
  const binary = strFromU8(zipped, true);
  return btoa(binary);
}

export function atou(base64: string): string {
  const binary = atob(base64);

  // zlib header (x78), level 9 (xDA)
  if (binary.startsWith("\x78\xDA")) {
    const buffer = strToU8(binary, true);
    const unzipped = unzlibSync(buffer);
    return strFromU8(unzipped);
  }

  // unicode hacks
  // https://base64.guru/developers/javascript/examples/unicode-strings
  return decodeURIComponent(escape(binary));
}
