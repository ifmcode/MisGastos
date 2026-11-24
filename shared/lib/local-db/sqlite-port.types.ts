import type { SQLiteParams } from "./expo-sqlite.sql";

export type { SQLiteParams };

export type SQLiteRunResult = { changes: number };

/** Statement-level handle: either the root connection or a transaction one. */
export interface SQLiteExecutor {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: SQLiteParams): Promise<SQLiteRunResult>;
  getAllAsync<T>(source: string, params: SQLiteParams): Promise<T[]>;
}

/**
 * The subset of `expo-sqlite`'s `SQLiteDatabase` this adapter needs. Structural
 * on purpose: tests can drive the port with a fake connection without loading
 * the native module.
 *
 * `withExclusiveTransactionAsync` runs the callback on a dedicated connection;
 * every query of the money transaction must use that handle. Web is not
 * supported by this API in expo-sqlite (documented limitation, no fallback in
 * this slice).
 */
export interface SQLiteConnection extends SQLiteExecutor {
  withExclusiveTransactionAsync(
    task: (txn: SQLiteExecutor) => Promise<void>,
  ): Promise<void>;
  closeAsync(): Promise<void>;
}
