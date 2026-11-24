import type {
  DatabasePort,
  LocalDatabaseTransaction,
  LocalQueryOptions,
} from "./database.port";
import {
  getTableRows,
  hasUniqueKeyConflict,
  matchesWhere,
  samePrimaryKey,
  snapshotTables,
  sortRows,
} from "./in-memory.helpers";
import { LOCAL_DB_ERROR_CODES, LocalDbError } from "./local-db.errors";
import type {
  LocalRow,
  LocalTableName,
  LocalWhere,
} from "./local-db.types";

/**
 * `DatabasePort` implementation backed by arrays. Test-only adapter that
 * mirrors SQLite semantics (null-safe `IS`, NULLs first on ASC, unique keys,
 * no nested transactions) so Jest fails where the device would.
 */
export class InMemoryDatabase implements DatabasePort {
  /** DDL recorded by `executeStatements`, for migration assertions. */
  readonly executedStatements: string[] = [];

  private tables = new Map<LocalTableName, LocalRow[]>();
  private schemaVersion = 0;
  private transactionOpen = false;

  /** Test helper: inserts rows without primary-key de-duplication. */
  seed(table: LocalTableName, rows: readonly LocalRow[]): void {
    this.rowsFor(table).push(...rows.map((row) => ({ ...row })));
  }

  async upsert(table: LocalTableName, row: LocalRow): Promise<void> {
    const rows = this.rowsFor(table);
    const index = rows.findIndex((candidate) =>
      samePrimaryKey(table, candidate, row),
    );

    if (index !== -1) {
      rows[index] = { ...row };
      return;
    }

    if (hasUniqueKeyConflict(table, row, rows)) {
      throw new LocalDbError(LOCAL_DB_ERROR_CODES.UNIQUE_VIOLATION);
    }

    rows.push({ ...row });
  }

  async update(
    table: LocalTableName,
    where: LocalWhere,
    changes: LocalRow,
  ): Promise<number> {
    let affected = 0;
    const rows = this.rowsFor(table);

    rows.forEach((row, index) => {
      if (!matchesWhere(row, where)) return;
      rows[index] = { ...row, ...changes };
      affected += 1;
    });

    return affected;
  }

  async delete(table: LocalTableName, where: LocalWhere): Promise<number> {
    const rows = this.rowsFor(table);
    const kept = rows.filter((row) => !matchesWhere(row, where));

    this.tables.set(table, kept);
    return rows.length - kept.length;
  }

  async select<T extends LocalRow>(
    table: LocalTableName,
    options: LocalQueryOptions = {},
  ): Promise<T[]> {
    const filtered = this.rowsFor(table).filter((row) =>
      matchesWhere(row, options.where),
    );
    const sorted = sortRows(filtered, options.orderBy);
    const limited =
      options.limit === undefined ? sorted : sorted.slice(0, options.limit);

    return limited.map((row) => ({ ...row }) as T);
  }

  async count(table: LocalTableName, where?: LocalWhere): Promise<number> {
    return this.rowsFor(table).filter((row) => matchesWhere(row, where)).length;
  }

  /** Rolls every table and the schema version back when `work` throws. */
  async transaction<T>(
    work: (tx: LocalDatabaseTransaction) => Promise<T>,
  ): Promise<T> {
    if (this.transactionOpen) {
      throw new LocalDbError(LOCAL_DB_ERROR_CODES.NESTED_TRANSACTION);
    }

    const snapshot = snapshotTables(this.tables);
    const versionSnapshot = this.schemaVersion;
    this.transactionOpen = true;

    try {
      return await work(this);
    } catch (error) {
      this.tables = snapshot;
      this.schemaVersion = versionSnapshot;
      throw error;
    } finally {
      this.transactionOpen = false;
    }
  }

  async getSchemaVersion(): Promise<number> {
    return this.schemaVersion;
  }

  async setSchemaVersion(version: number): Promise<void> {
    this.schemaVersion = version;
  }

  async executeStatements(statements: readonly string[]): Promise<void> {
    this.executedStatements.push(...statements);
  }

  async close(): Promise<void> {
    // Nothing to release: the in-memory adapter owns no OS resource.
  }

  private rowsFor(table: LocalTableName): LocalRow[] {
    return getTableRows(this.tables, table);
  }
}
