import type { LocalRow } from "./local-db.types";

/** Addressable id of a cached row, or null when the row cannot be matched. */
export function readLocalRowId(row: LocalRow): string | null {
  const value = row.id;
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

/** Owner stored in a cached row (empty when malformed). */
export function readLocalRowOwnerId(row: LocalRow): string {
  return typeof row.ownerId === "string" ? row.ownerId : "";
}
