import { describe, expect, it } from "@jest/globals";

import type { LocalTableName } from "../local-db.types";
import { MIGRATION_001 } from "../migrations/migration-001";
import {
  LOCAL_DB_PRIMARY_KEYS,
  LOCAL_DB_UNIQUE_KEYS,
  SCHEMA_CURRENT_STATEMENTS,
} from "../schema";

/** ADR §4 contract plus the phase-3 read-cache columns. */
const REQUIRED_COLUMNS: Record<LocalTableName, readonly string[]> = {
  wallets: [
    "id", "ownerId", "name", "currency", "type", "icon", "color",
    "initialBalance", "serverBalance", "includeInTotal", "description",
    "archivedAt", "sortOrder", "createdAt", "updatedAt", "deletedAt",
    "revision", "syncStatus",
  ],
  categories: [
    "id", "ownerId", "name", "type", "color", "icon", "sortOrder",
    "legacyId", "createdAt", "updatedAt", "deletedAt", "revision",
    "syncStatus",
  ],
  transactions: [
    "id", "ownerId", "type", "amount", "currency", "walletId", "walletName",
    "categoryId", "concept", "date", "notes", "sharedExpenseId",
    "groupExpenseId", "settlementId", "groupSettlementId", "createdAt",
    "updatedAt", "deletedAt", "revision", "syncStatus",
  ],
  transfers: [
    "id", "ownerId", "fromWalletId", "toWalletId", "fromWalletName",
    "toWalletName", "amount", "currency", "date", "notes", "createdAt",
    "updatedAt", "deletedAt", "revision", "syncStatus",
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
  cacheMeta: ["ownerId", "collection", "fetchedAt"],
  friendships: [
    "id", "ownerId", "memberIds", "requesterId", "recipientId", "createdAt",
    "updatedAt", "syncStatus",
  ],
  friendRequests: [
    "id", "ownerId", "requesterId", "recipientId", "participantIds", "status",
    "createdAt", "updatedAt", "syncStatus",
  ],
  publicProfiles: [
    "id", "ownerId", "displayName", "email", "createdAt", "updatedAt",
    "syncStatus",
  ],
  groups: [
    "id", "ownerId", "groupOwnerId", "createdBy", "memberIds", "name",
    "description", "defaultCurrency", "joinCode", "simplifyDebts", "createdAt",
    "updatedAt", "syncStatus",
  ],
  groupInvitations: [
    "id", "ownerId", "groupId", "groupName", "inviterId", "inviteeId",
    "pairId", "status", "createdAt", "updatedAt", "syncStatus",
  ],
  sharedExpenses: [
    "id", "ownerId", "participantIds", "pairId", "payerId", "amountCents",
    "currency", "splitMode", "participants", "description", "date", "walletId",
    "categoryId", "linkedTransactionId", "createdBy", "createdAt", "updatedAt",
    "deletedAt", "revision", "syncStatus",
  ],
  settlements: [
    "id", "ownerId", "participantIds", "pairId", "fromUserId", "toUserId",
    "amountCents", "currency", "date", "note", "createdBy", "createdAt",
    "updatedAt", "deletedAt", "receiverWalletId", "receiverCategoryId",
    "receiverTransactionId", "revision", "syncStatus",
  ],
  groupExpenses: [
    "id", "ownerId", "groupId", "payerId", "amountCents", "currency",
    "splitMode", "participants", "description", "date", "walletId",
    "categoryId", "linkedTransactionId", "createdBy", "createdAt", "updatedAt",
    "deletedAt", "revision", "syncStatus",
  ],
  groupSettlements: [
    "id", "ownerId", "groupId", "participantIds", "pairId", "fromUserId",
    "toUserId", "amountCents", "currency", "date", "note", "createdBy",
    "createdAt", "updatedAt", "deletedAt", "receiverWalletId",
    "receiverCategoryId", "receiverTransactionId", "revision", "syncStatus",
  ],
};

const REQUIRED_INDEXES = [
  "ON wallets (ownerId, archivedAt, createdAt)",
  "ON transactions (ownerId, date)",
  "ON transactions (ownerId, walletId)",
  "ON outbox (ownerId, seq)",
  "ON conflicts (ownerId)",
  "ON sharedExpenses (ownerId)",
  "ON settlements (ownerId)",
  "ON groupExpenses (ownerId, groupId)",
  "ON groupSettlements (ownerId, groupId)",
  "ON friendships (ownerId)",
  "ON friendRequests (ownerId)",
  "ON groups (ownerId)",
  "ON groupInvitations (ownerId)",
];

function tableStatement(table: LocalTableName): string {
  const statement = SCHEMA_CURRENT_STATEMENTS.find((entry) =>
    entry.includes(`CREATE TABLE IF NOT EXISTS ${table} (`),
  );

  if (!statement) throw new Error(`missing CREATE TABLE for ${table}`);
  return statement;
}

describe("current schema contract", () => {
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

  it("declares the outbox unique key and its primary keys", () => {
    expect(tableStatement("outbox")).toContain(
      "UNIQUE (ownerId, entityType, entityId)",
    );
    expect(LOCAL_DB_UNIQUE_KEYS.outbox).toEqual([
      ["ownerId", "entityType", "entityId"],
    ]);
    expect(LOCAL_DB_PRIMARY_KEYS.outbox).toEqual(["clientMutationId"]);
    expect(LOCAL_DB_PRIMARY_KEYS.outboxSeq).toEqual(["ownerId"]);
    expect(LOCAL_DB_PRIMARY_KEYS.syncState).toEqual(["ownerId"]);
    expect(LOCAL_DB_PRIMARY_KEYS.cacheMeta).toEqual(["ownerId", "collection"]);
  });

  it.each(REQUIRED_INDEXES)("creates the index %s", (index) => {
    expect(
      SCHEMA_CURRENT_STATEMENTS.some((statement) =>
        statement.includes(index),
      ),
    ).toBe(true);
  });

  it("allows a null category sortOrder in the current schema", () => {
    const statement = tableStatement("categories");

    expect(statement).toMatch(/\bsortOrder\s+INTEGER\s*,/);
    expect(statement).not.toMatch(/\bsortOrder\s+INTEGER\s+NOT NULL/);
  });

  it("allows a null wallet sortOrder in the current schema", () => {
    const statement = tableStatement("wallets");

    expect(statement).toMatch(/\bsortOrder\s+INTEGER\s*,/);
    expect(statement).not.toMatch(/\bsortOrder\s+INTEGER\s+NOT NULL/);
  });

  it("keeps the v1 snapshot frozen before the read-cache additions", () => {
    const statements = MIGRATION_001.statements.join("\n");

    expect(statements).not.toContain("sharedExpenseId");
    expect(statements).not.toContain("fromWalletName");
    expect(statements).not.toContain("cacheMeta");
  });
});
