import { describe, expect, it } from "@jest/globals";

import type { LocalTableName } from "../local-db.types";
import {
  LOCAL_DB_PRIMARY_KEYS,
  LOCAL_DB_UNIQUE_KEYS,
  SCHEMA_V1_STATEMENTS,
} from "../schema";

/** ADR §4 contract: every column the sync engine relies on. */
const REQUIRED_COLUMNS: Record<LocalTableName, readonly string[]> = {
  wallets: [
    "id", "ownerId", "name", "currency", "type", "icon", "color",
    "initialBalance", "serverBalance", "includeInTotal", "description",
    "archivedAt", "createdAt", "updatedAt", "deletedAt", "revision",
    "syncStatus",
  ],
  categories: [
    "id", "ownerId", "name", "type", "color", "icon", "sortOrder",
    "legacyId", "createdAt", "updatedAt", "deletedAt", "revision",
    "syncStatus",
  ],
  transactions: [
    "id", "ownerId", "type", "amount", "currency", "walletId", "walletName",
    "categoryId", "concept", "date", "notes", "createdAt", "updatedAt",
    "deletedAt", "revision", "syncStatus",
  ],
  transfers: [
    "id", "ownerId", "fromWalletId", "toWalletId", "amount", "currency",
    "date", "notes", "createdAt", "updatedAt", "deletedAt", "revision",
    "syncStatus",
  ],
  outbox: [
    "clientMutationId", "ownerId", "seq", "entityType", "entityId",
    "operation", "baseRevision", "localSnapshot", "serverSnapshot",
    "dependsOn", "status", "attempts", "nextAttemptAt", "lastErrorCode",
    "createdAt", "updatedAt",
  ],
  outboxSeq: ["ownerId", "nextSeq"],
  conflicts: [
    "id", "ownerId", "clientMutationId", "entityType", "entityId", "kind",
    "localSnapshot", "remoteSnapshot", "detectedAt", "resolvedAt",
    "resolution",
  ],
  syncState: [
    "ownerId", "lastPullAt", "lastPushAt", "lastFullSyncAt", "lastErrorCode",
  ],
};

const REQUIRED_INDEXES = [
  "ON wallets (ownerId, archivedAt, createdAt)",
  "ON transactions (ownerId, date)",
  "ON transactions (ownerId, walletId)",
  "ON outbox (ownerId, seq)",
  "ON conflicts (ownerId)",
];

function tableStatement(table: LocalTableName): string {
  const statement = SCHEMA_V1_STATEMENTS.find((entry) =>
    entry.includes(`CREATE TABLE IF NOT EXISTS ${table} (`),
  );

  if (!statement) throw new Error(`missing CREATE TABLE for ${table}`);
  return statement;
}

describe("schema v1 contract", () => {
  it.each(
    Object.entries(REQUIRED_COLUMNS) as ReadonlyArray<
      [LocalTableName, readonly string[]]
    >,
  )("defines every required %s column", (table, columns) => {
    const statement = tableStatement(table);

    for (const column of columns) {
      expect(statement).toMatch(
        new RegExp(`\\b${column}\\s+(TEXT|INTEGER|REAL)\\b`),
      );
    }
  });

  it("declares the outbox unique key and its primary key", () => {
    expect(tableStatement("outbox")).toContain(
      "UNIQUE (ownerId, entityType, entityId)",
    );
    expect(LOCAL_DB_UNIQUE_KEYS.outbox).toEqual([
      ["ownerId", "entityType", "entityId"],
    ]);
    expect(LOCAL_DB_PRIMARY_KEYS.outbox).toEqual(["clientMutationId"]);
    expect(LOCAL_DB_PRIMARY_KEYS.outboxSeq).toEqual(["ownerId"]);
    expect(LOCAL_DB_PRIMARY_KEYS.syncState).toEqual(["ownerId"]);
  });

  it.each(REQUIRED_INDEXES)("creates the index %s", (index) => {
    expect(
      SCHEMA_V1_STATEMENTS.some((statement) => statement.includes(index)),
    ).toBe(true);
  });
});
