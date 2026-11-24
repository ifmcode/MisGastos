import type {
  SQLiteConnection,
  SQLiteExecutor,
  SQLiteParams,
  SQLiteRunResult,
} from "../sqlite-port";

export type Call = { sql: string; params: SQLiteParams };

export class FakeExecutor implements SQLiteExecutor {
  readonly calls: Call[] = [];
  readonly executed: string[] = [];
  readonly runResults: SQLiteRunResult[] = [];
  readonly allResults: unknown[][] = [];

  async execAsync(source: string): Promise<void> {
    this.executed.push(source);
  }

  async runAsync(
    source: string,
    params: SQLiteParams,
  ): Promise<SQLiteRunResult> {
    this.calls.push({ sql: source, params });
    return this.runResults.shift() ?? { changes: 0 };
  }

  async getAllAsync<T>(source: string, params: SQLiteParams): Promise<T[]> {
    this.calls.push({ sql: source, params });
    return (this.allResults.shift() ?? []) as unknown as T[];
  }
}

export class FakeConnection extends FakeExecutor implements SQLiteConnection {
  readonly transactionHandle = new FakeExecutor();
  transactions = 0;
  closed = false;

  async withExclusiveTransactionAsync(
    task: (txn: SQLiteExecutor) => Promise<void>,
  ): Promise<void> {
    this.transactions += 1;
    await task(this.transactionHandle);
  }

  async closeAsync(): Promise<void> {
    this.closed = true;
  }
}
