import type { LocalRow } from "../local-db.types";

/** Minimal row for the in-memory adapter tests. */
export function buildRow(overrides: LocalRow = {}): LocalRow {
  return { id: "x", ownerId: "owner-1", ...overrides };
}
