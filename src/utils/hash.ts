import { decompress } from "./compress";
import * as loading from "../components/loading";
import { loadExamples } from "../examples";

export async function toSources(
  hashData: string,
): Promise<Record<string, string> | null> {
  const queryParam = decompress(hashData);
  if (queryParam) {
    return queryParam as unknown as Record<string, string>;
  }
  if (!hashData) {
    return null;
  }
  const name = decodeURIComponent(hashData);
  loading.open();
  try {
    const examples = await loadExamples();
    return examples[name]?.files ?? null;
  } finally {
    loading.close();
  }
}

export function getHashData(): string {
  return window.location.hash.slice(window.location.hash.indexOf("#") + 1);
}
