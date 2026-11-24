import type { LocalQueryOptions } from "./database.port";
import {
  buildCount,
  buildDelete,
  buildSelect,
  buildUpdate,
  buildUpsert,
} from "./expo-sqlite.sql";
import type { LocalRow, LocalTableName, LocalWhere } from "./local-db.types";
import type { SQLiteExecutor } from "./sqlite-port.types";

export async function runUpsert(
  executor: SQLiteExecutor,
  table: LocalTableName,
  row: LocalRow,
): Promise<void> {
  const statement = buildUpsert(table, row);
  await executor.runAsync(statement.sql, statement.params);
}

export async function runUpdate(
  executor: SQLiteExecutor,
  table: LocalTableName,
  where: LocalWhere,
  changes: LocalRow,
): Promise<number> {
  if (Object.keys(changes).length === 0) return 0;

  const statement = buildUpdate(table, where, changes);
  const result = await executor.runAsync(statement.sql, statement.params);

  return result.changes;
}

export async function runDelete(
  executor: SQLiteExecutor,
  table: LocalTableName,
  where: LocalWhere,
): Promise<number> {
  const statement = buildDelete(table, where);
  const result = await executor.runAsync(statement.sql, statement.params);

  return result.changes;
}

export async function readRows<T extends LocalRow>(
  executor: SQLiteExecutor,
  table: LocalTableName,
  options: LocalQueryOptions = {},
): Promise<T[]> {
  const statement = buildSelect(table, options);

  return executor.getAllAsync<T>(statement.sql, statement.params);
}

export async function countRows(
  executor: SQLiteExecutor,
  table: LocalTableName,
  where?: LocalWhere,
): Promise<number> {
  const statement = buildCount(table, where);
  const rows = await executor.getAllAsync<{ total: number }>(
    statement.sql,
    statement.params,
  );

  return rows[0]?.total ?? 0;
}

export async function executeAll(
  executor: SQLiteExecutor,
  statements: readonly string[],
): Promise<void> {
  for (const statement of statements) {
    await executor.execAsync(statement);
  }
}

export async function readSchemaVersion(
  executor: SQLiteExecutor,
): Promise<number> {
  const rows = await executor.getAllAsync<{ user_version: number }>(
    "PRAGMA user_version",
    {},
  );

  return rows[0]?.user_version ?? 0;
}

export async function writeSchemaVersion(
  executor: SQLiteExecutor,
  version: number,
): Promise<void> {
  // PRAGMA does not accept bound parameters; the value is an internal integer.
  const safeVersion = Math.max(0, Math.trunc(version));
  await executor.execAsync(`PRAGMA user_version = ${safeVersion}`);
}
