import type {
  LocalRow,
  LocalTableName,
  LocalWhere,
} from "./local-db.types";

export type LocalOrderBy = {
  column: string;
  direction?: "asc" | "desc";
};

export type LocalQueryOptions = {
  where?: LocalWhere;
  orderBy?: LocalOrderBy[];
  limit?: number;
};

/**
 * Operations available inside a database transaction. Table and column names
 * are internal constants, never user input; every value is bound as a
 * parameter.
 *
 * Transactions never nest: calling `transaction()` again while one is open
 * throws `LOCAL_DB_NESTED_TRANSACTION`. Repositories accept an optional
 * trailing `tx` so a use case can group several writes in one transaction.
 */
export interface LocalDatabaseTransaction {
  /**
   * Inserts or updates by primary key. Always pass the WHOLE row: an upsert
   * never leaves columns from a previous write behind (SQLite `REPLACE` used to
   * erase them).
   */
  upsert(table: LocalTableName, row: LocalRow): Promise<void>;
  /** Returns the number of affected rows. */
  update(
    table: LocalTableName,
    where: LocalWhere,
    changes: LocalRow,
  ): Promise<number>;
  /** Returns the number of affected rows. */
  delete(table: LocalTableName, where: LocalWhere): Promise<number>;
  select<T extends LocalRow>(
    table: LocalTableName,
    options?: LocalQueryOptions,
  ): Promise<T[]>;
  count(table: LocalTableName, where?: LocalWhere): Promise<number>;
  /** DDL only; used by the migrator. Repositories must not call it. */
  executeStatements(statements: readonly string[]): Promise<void>;
  /** Schema bookkeeping; used by the migrator. Repositories must not call it. */
  setSchemaVersion(version: number): Promise<void>;
}

/**
 * The persistence abstraction every local repository depends on. Keeps Jest
 * free of native modules: the in-memory adapter implements the same contract.
 */
export interface DatabasePort extends LocalDatabaseTransaction {
  transaction<T>(
    work: (tx: LocalDatabaseTransaction) => Promise<T>,
  ): Promise<T>;
  getSchemaVersion(): Promise<number>;
  close(): Promise<void>;
}
