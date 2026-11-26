import type {
  DatabasePort,
  LocalDatabaseTransaction,
  LocalQueryOptions,
} from "./database.port";
import type { LocalRow, LocalTableName, LocalWhere } from "./local-db.types";

let tail: Promise<unknown> = Promise.resolve();

/**
 * Serializes local database transactions process-wide.
 *
 * SQLite allows one write transaction at a time, but the read cache, the
 * offline write repositories and the sync engine all run on the same port.
 * Queueing instead of failing keeps a user write and a cache mirror from
 * aborting each other (phase-5 decision). Code that already owns a transaction
 * must pass it down instead of opening another one.
 */
export function withLocalDbLock<T>(work: () => Promise<T>): Promise<T> {
  const run = tail.then(work, work);
  tail = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

/** Test seam: drops the queued chain. */
export function resetLocalDbLock(): void {
  tail = Promise.resolve();
}

/** Wraps a port so its transactions run one after another, never interleaved. */
export function createSerializedDatabasePort(port: DatabasePort): DatabasePort {
  return {
    transaction: <T>(work: (tx: LocalDatabaseTransaction) => Promise<T>) =>
      withLocalDbLock(() => port.transaction(work)),
    upsert: (table: LocalTableName, row: LocalRow) => port.upsert(table, row),
    update: (table: LocalTableName, where: LocalWhere, changes: LocalRow) =>
      port.update(table, where, changes),
    delete: (table: LocalTableName, where: LocalWhere) =>
      port.delete(table, where),
    select: <T extends LocalRow>(
      table: LocalTableName,
      options?: LocalQueryOptions,
    ) => port.select<T>(table, options),
    count: (table: LocalTableName, where?: LocalWhere) =>
      port.count(table, where),
    executeStatements: (statements: readonly string[]) =>
      port.executeStatements(statements),
    setSchemaVersion: (version: number) => port.setSchemaVersion(version),
    getSchemaVersion: () => port.getSchemaVersion(),
    close: () => port.close(),
  };
}
