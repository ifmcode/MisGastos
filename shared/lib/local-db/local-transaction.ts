import type {
  DatabasePort,
  LocalDatabaseTransaction,
} from "./database.port";

/**
 * Runs `work` inside the caller's transaction when `tx` is provided, and opens
 * a new one through the port otherwise. The single place that decides whether
 * a repository method owns the transaction (ADR §6: record + balance + outbox
 * row must commit together).
 */
export async function runInLocalTransaction<T>(
  port: DatabasePort,
  tx: LocalDatabaseTransaction | undefined,
  work: (active: LocalDatabaseTransaction) => Promise<T>,
): Promise<T> {
  if (tx) return work(tx);

  return port.transaction(work);
}
