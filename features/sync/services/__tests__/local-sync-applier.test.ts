import { beforeEach, describe, expect, it } from "@jest/globals";

import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import { LocalConflictRepository } from "@/shared/lib/local-db/local-conflict.repository";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import type { OutboxMutation } from "@/shared/lib/local-db/local-db.types";

import { LocalSyncApplier } from "../local-sync-applier";

const NOW = "2026-11-26T10:00:00.000Z";

function buildMutation(overrides: Partial<OutboxMutation> = {}): OutboxMutation {
  return {
    clientMutationId: "m1",
    ownerId: "owner-1",
    seq: 1,
    entityType: "transaction",
    entityId: "tx-1",
    operation: "update",
    baseRevision: 0,
    localSnapshot: { id: "tx-1", amount: 25 },
    serverSnapshot: {},
    dependsOn: [],
    status: "pending",
    attempts: 0,
    nextAttemptAt: null,
    lastErrorCode: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

async function seedRecord(db: InMemoryDatabase) {
  await db.upsert("transactions", {
    id: "tx-1",
    ownerId: "owner-1",
    type: "expense",
    amount: 25,
    currency: "EUR",
    walletId: "wallet-1",
    categoryId: "cat-1",
    concept: "Supermercado",
    date: "2026-11-26",
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    revision: 0,
    syncStatus: "pending",
  });
  await db.upsert("wallets", {
    id: "wallet-1",
    ownerId: "owner-1",
    name: "Cuenta",
    currency: "EUR",
    type: "bank",
    icon: "wallet",
    color: "#000",
    initialBalance: 100,
    serverBalance: 100,
    includeInTotal: 1,
    description: null,
    archivedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    revision: 1,
    syncStatus: "synced",
  });
}

describe("LocalSyncApplier", () => {
  let db: InMemoryDatabase;
  let outbox: LocalOutboxRepository;
  let applier: LocalSyncApplier;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    outbox = new LocalOutboxRepository(db);
    applier = new LocalSyncApplier(async () => db);
    await seedRecord(db);
    await outbox.enqueue({
      clientMutationId: "m1",
      ownerId: "owner-1",
      entityType: "transaction",
      entityId: "tx-1",
      operation: "update",
      baseRevision: 0,
      localSnapshot: { id: "tx-1", amount: 25 },
      now: NOW,
    });
  });

  it("marks the record synced, stores the balances and drops the queue row", async () => {
    await applier.applySuccess({
      ownerId: "owner-1",
      mutation: buildMutation(),
      revisionAfter: 1,
      wallets: [{ id: "wallet-1", balance: 75, revision: 2 }],
      now: NOW,
    });

    const [transaction] = await db.select("transactions", {
      where: { id: "tx-1" },
    });
    const [wallet] = await db.select("wallets", { where: { id: "wallet-1" } });

    expect(transaction).toMatchObject({ revision: 1, syncStatus: "synced" });
    expect(wallet).toMatchObject({ serverBalance: 75, revision: 2 });
    await expect(outbox.listByOwner("owner-1")).resolves.toEqual([]);
  });

  it("opens a conflict and stops the queued mutation with its evidence", async () => {
    await applier.applyConflict({
      ownerId: "owner-1",
      mutation: buildMutation(),
      kind: "REMOTE_CHANGED",
      errorCode: "SYNC_REMOTE_CHANGED",
      remoteSnapshot: { revision: 4, amount: 30 },
      now: NOW,
    });

    const [conflict] = await new LocalConflictRepository(db).listOpen(
      "owner-1",
    );
    const [transaction] = await db.select("transactions", {
      where: { id: "tx-1" },
    });
    const [mutation] = await outbox.listByOwner("owner-1");

    expect(conflict).toMatchObject({
      clientMutationId: "m1",
      kind: "REMOTE_CHANGED",
      remoteSnapshot: { revision: 4, amount: 30 },
    });
    expect(transaction.syncStatus).toBe("conflict");
    expect(mutation).toMatchObject({
      status: "conflict",
      lastErrorCode: "SYNC_REMOTE_CHANGED",
    });
  });

  it("records a retryable failure with its backoff window", async () => {
    await applier.applyFailure({
      ownerId: "owner-1",
      mutation: buildMutation(),
      errorCode: "unavailable",
      attempts: 2,
      nextAttemptAt: "2026-11-26T10:05:00.000Z",
      now: NOW,
    });

    const [mutation] = await outbox.listByOwner("owner-1");
    const [transaction] = await db.select("transactions", {
      where: { id: "tx-1" },
    });

    expect(mutation).toMatchObject({
      status: "failed",
      attempts: 2,
      nextAttemptAt: "2026-11-26T10:05:00.000Z",
      lastErrorCode: "unavailable",
    });
    expect(transaction.syncStatus).toBe("failed");
  });

  it("does nothing when there is no local database", async () => {
    const withoutPort = new LocalSyncApplier(async () => null);

    await expect(
      withoutPort.applySuccess({
        ownerId: "owner-1",
        mutation: buildMutation(),
        revisionAfter: 1,
        wallets: [],
        now: NOW,
      }),
    ).resolves.toBeUndefined();
  });
});
