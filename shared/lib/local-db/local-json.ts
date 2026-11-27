/**
 * JSON columns of the local cache. A malformed value is returned as `null` so a
 * mapper can drop the record instead of throwing on a corrupted row.
 */
export function encodeLocalJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return "null";
  }
}

export function decodeLocalJson(value: unknown): unknown {
  if (typeof value !== "string" || value.trim().length === 0) return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
