import type {
  DatabasePort,
  LocalDatabaseTransaction,
  LocalQueryOptions,
} from "./database.port";
import { LOCAL_DB_ERROR_CODES, LocalDbError } from "./local-db.errors";
import type {
  LocalRow,
  LocalTableName,
  LocalWhere,
} from "./local-db.types";
import {
  countRows,
  executeAll,
  readRows,
  readSchemaVersion,
  runDelete,
  runUpdate,
  runUpsert,
  writeSchemaVersion,
} from "./sqlite-port.statements";
import type {
  SQLiteConnection,
  SQLiteExecutor,
} from "./sqlite-port.types";

class SQLiteDatabasePort implements DatabasePort {
  private transactionOpen = false;

  constructor(private readonly connection: SQLiteConnection) {}

  async upsert(table: LocalTableName, row: LocalRow): Promise<void> {
    await runUpsert(this.connection, table, row);
  }

  async update(
    table: LocalTableName,
    where: LocalWhere,
    changes: LocalRow,
  ): Promise<number> {
    return runUpdate(this.connection, table, where, changes);
  }

  async delete(table: LocalTableName, where: LocalWhere): Promise<number> {
    return runDelete(this.connection, table, where);
  }

  async select<T extends LocalRow>(
    table: LocalTableName,
    options: LocalQueryOptions = {},
  ): Promise<T[]> {
    return readRows<T>(this.connection, table, options);
  }

  async count(table: LocalTableName, where?: LocalWhere): Promise<number> {
    return countRows(this.connection, table, where);
  }

  async executeStatements(statements: readonly string[]): Promise<void> {
    await executeAll(this.connection, statements);
  }

  async getSchemaVersion(): Promise<number> {
    return readSchemaVersion(this.connection);
  }

  async setSchemaVersion(version: number): Promise<void> {
    await writeSchemaVersion(this.connection, version);
  }

  async close(): Promise<void> {
    await this.connection.closeAsync();
  }

  /**
   * Exclusive transaction on the handle expo-sqlite passes to the callback:
   * unrelated queries on the root connection cannot interleave with a money
   * write. Web does not support exclusive transactions (documented limitation of
   * this slice); nesting is rejected because the inner work must reuse `tx`.
   */
  async transaction<T>(
    work: (tx: LocalDatabaseTransaction) => Promise<T>,
  ): Promise<T> {
    if (this.transactionOpen) {
      throw new LocalDbError(LOCAL_DB_ERROR_CODES.NESTED_TRANSACTION);
    }

    this.transactionOpen = true;
    let result!: T;

    try {
      await this.connection.withExclusiveTransactionAsync(async (txn) => {
        result = await work(this.transactionOperations(txn));
      });
    } finally {
      this.transactionOpen = false;
    }

    return result;
  }

  private transactionOperations(
    txn: SQLiteExecutor,
  ): LocalDatabaseTransaction {
    return {
      upsert: (table, row) => runUpsert(txn, table, row),
      update: (table, where, changes) => runUpdate(txn, table, where, changes),
      delete: (table, where) => runDelete(txn, table, where),
      select: (table, options) => readRows(txn, table, options),
      count: (table, where) => countRows(txn, table, where),
      executeStatements: (statements) => executeAll(txn, statements),
      setSchemaVersion: (version) => writeSchemaVersion(txn, version),
    };
  }
}

export function createSQLiteDatabasePort(
  connection: SQLiteConnection,
): DatabasePort {
  return new SQLiteDatabasePort(connection);
}

export type {
  SQLiteConnection,
  SQLiteExecutor,
  SQLiteParams,
  SQLiteRunResult,
} from "./sqlite-port.types";
