import type { LocalTableName } from "./local-db.types";

/** Column(s) that identify one row of each local table. */
export const LOCAL_DB_PRIMARY_KEYS: Record<
  LocalTableName,
  readonly string[]
> = {
  wallets: ["id"],
  categories: ["id"],
  transactions: ["id"],
  transfers: ["id"],
  outbox: ["clientMutationId"],
  outboxSeq: ["ownerId"],
  conflicts: ["id"],
  syncState: ["ownerId"],
};

/**
 * Unique constraints declared in the DDL, aside from the primary key. The
 * in-memory adapter enforces them so a repository bug fails in Jest instead of
 * only on the device (SQLite would reject the write).
 */
export const LOCAL_DB_UNIQUE_KEYS: Partial<
  Record<LocalTableName, readonly (readonly string[])[]>
> = {
  outbox: [["ownerId", "entityType", "entityId"]],
};
