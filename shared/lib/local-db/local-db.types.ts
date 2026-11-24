/**
 * Scalar values the local SQLite database can hold. Booleans are stored as
 * 0/1 and ISO dates as TEXT, so every column is one of these three.
 */
export type LocalColumnValue = string | number | null;

export type LocalRow = Record<string, LocalColumnValue>;
export type LocalWhere = Record<string, LocalColumnValue>;

export type LocalTableName =
  | "wallets"
  | "categories"
  | "transactions"
  | "transfers"
  | "outbox"
  | "outboxSeq"
  | "conflicts"
  | "syncState"
  | "cacheMeta";

/**
 * Personal collections mirrored into the local read cache. Shared/social data
 * is intentionally absent: phase 3 only caches what the personal screens list.
 */
export type LocalCacheCollection =
  | "wallets"
  | "categories"
  | "transactions"
  | "transfers";

/** Sync status carried by every record table (see ADR §4). */
export type LocalRecordSyncStatus =
  | "synced"
  | "pending"
  | "syncing"
  | "failed"
  | "conflict";

export type OutboxEntityType =
  | "wallet"
  | "category"
  | "transaction"
  | "transfer";

export type OutboxOperation = "create" | "update" | "delete";

export type OutboxStatus = "pending" | "syncing" | "failed" | "conflict";

/** Entity that must be pushed before the mutation can run (offline create). */
export type OutboxDependency = {
  entityType: OutboxEntityType;
  entityId: string;
};

/** One queued mutation as persisted in the `outbox` table. */
export type OutboxMutation = {
  clientMutationId: string;
  ownerId: string;
  seq: number;
  entityType: OutboxEntityType;
  entityId: string;
  operation: OutboxOperation;
  /** Revision the server knows; compared against the remote one before applying. */
  baseRevision: number;
  localSnapshot: Record<string, unknown>;
  serverSnapshot: Record<string, unknown>;
  dependsOn: OutboxDependency[];
  status: OutboxStatus;
  attempts: number;
  nextAttemptAt: string | null;
  lastErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * What a local repository hands to the outbox. `seq`, `status`, `attempts` and
 * the audit dates are owned by the repository; `now` is the single time source.
 */
export type OutboxMutationInput = {
  clientMutationId: string;
  ownerId: string;
  entityType: OutboxEntityType;
  entityId: string;
  operation: OutboxOperation;
  baseRevision: number;
  localSnapshot: Record<string, unknown>;
  serverSnapshot?: Record<string, unknown>;
  dependsOn?: OutboxDependency[];
  nextAttemptAt?: string | null;
  lastErrorCode?: string | null;
  now: string;
};

/** Last known sync bookkeeping for one account. Null fields mean "never". */
export type LocalSyncState = {
  ownerId: string;
  lastPullAt: string | null;
  lastPushAt: string | null;
  lastFullSyncAt: string | null;
  lastErrorCode: string | null;
};

/** Descriptor of one schema version; statements are DDL only. */
export type LocalDbMigration = {
  version: number;
  statements: readonly string[];
};
