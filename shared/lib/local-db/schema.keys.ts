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
  friendships: ["ownerId", "id"],
  friendRequests: ["ownerId", "id"],
  publicProfiles: ["ownerId", "id"],
  groups: ["ownerId", "id"],
  groupInvitations: ["ownerId", "id"],
  sharedExpenses: ["ownerId", "id"],
  settlements: ["ownerId", "id"],
  groupExpenses: ["ownerId", "id"],
  groupSettlements: ["ownerId", "id"],
  outbox: ["clientMutationId"],
  outboxSeq: ["ownerId"],
  conflicts: ["id"],
  syncState: ["ownerId"],
  cacheMeta: ["ownerId", "collection"],
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
