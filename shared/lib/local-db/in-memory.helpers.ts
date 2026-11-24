import type { LocalQueryOptions } from "./database.port";
import type {
  LocalColumnValue,
  LocalRow,
  LocalTableName,
  LocalWhere,
} from "./local-db.types";
import { LOCAL_DB_PRIMARY_KEYS, LOCAL_DB_UNIQUE_KEYS } from "./schema";

/** Null-safe equality, like SQLite's `IS` operator. */
export function matchesWhere(row: LocalRow, where?: LocalWhere): boolean {
  if (!where) return true;

  return Object.entries(where).every(
    ([column, value]) => (row[column] ?? null) === (value ?? null),
  );
}

export function compareValues(
  left: LocalColumnValue,
  right: LocalColumnValue,
): number {
  if (left === right) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  if (typeof left === "number" && typeof right === "number") return left - right;

  return String(left) < String(right) ? -1 : 1;
}

export function sortRows(
  rows: LocalRow[],
  orderBy: LocalQueryOptions["orderBy"],
): LocalRow[] {
  if (!orderBy || orderBy.length === 0) return rows;

  return [...rows].sort((left, right) => {
    for (const { column, direction } of orderBy) {
      const factor = direction === "desc" ? -1 : 1;
      const result = compareValues(left[column] ?? null, right[column] ?? null);
      if (result !== 0) return result * factor;
    }

    return 0;
  });
}

/** Matches by the table's declared primary key (see `schema.keys.ts`). */
export function samePrimaryKey(
  table: LocalTableName,
  left: LocalRow,
  right: LocalRow,
): boolean {
  return LOCAL_DB_PRIMARY_KEYS[table].every(
    (column) => left[column] === right[column],
  );
}

/** True when another row already owns one of the table's unique keys. */
export function hasUniqueKeyConflict(
  table: LocalTableName,
  candidate: LocalRow,
  rows: readonly LocalRow[],
): boolean {
  const uniqueKeys = LOCAL_DB_UNIQUE_KEYS[table] ?? [];

  return uniqueKeys.some((key) =>
    rows.some(
      (row) =>
        !samePrimaryKey(table, row, candidate) &&
        key.every((column) => (row[column] ?? null) === (candidate[column] ?? null)),
    ),
  );
}

export function getTableRows(
  tables: Map<LocalTableName, LocalRow[]>,
  table: LocalTableName,
): LocalRow[] {
  const existing = tables.get(table);
  if (existing) return existing;

  const created: LocalRow[] = [];
  tables.set(table, created);
  return created;
}

export function snapshotTables(
  tables: Map<LocalTableName, LocalRow[]>,
): Map<LocalTableName, LocalRow[]> {
  const copy = new Map<LocalTableName, LocalRow[]>();

  for (const [table, rows] of tables) {
    copy.set(
      table,
      rows.map((row) => ({ ...row })),
    );
  }

  return copy;
}
