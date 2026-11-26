import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import { LocalConflictRepository } from "@/shared/lib/local-db/local-conflict.repository";
import { LOCAL_DB_ERROR_CODES } from "@/shared/lib/local-db/local-db.errors";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import type { LocalConflictKind } from "@/shared/lib/local-db/local-db.types";

import { resolveLocalConflict } from "../local-conflict-resolver";

const NOW = "2026-11-26T10:00:00.000Z";
const REMOTE = {
  id: "tx-1",
  amount: 40,
  concept: "Cena",
  revision: 5,
  updatedAt: NOW,
};

async function seed(db: InMemoryDatabase, kind: LocalConflictKind, operation: "update" | "delete" = "update") {
  const outbox = new LocalOutboxRepository(db);
  const conflicts = new LocalConflictRepository(db);

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
    revision: 2,
    syncStatus: "conflict",
  });

  await outbox.enqueue({
    clientMutationId: "m1",
    ownerId: "owner-1",
    entityType: "transaction",
    entityId: "tx-1",
    operation,
    baseRevision: 2,
    localSnapshot: { id: "tx-1", amount: 25 },
    now: NOW,
  });
  await outbox.markConflict("owner-1", "m1", {
    errorCode: `SYNC_${kind}`,
    now: NOW,
  });
  const conflict = await conflicts.create({
    ownerId: "owner-1",
    clientMutationId: "m1",
    entityType: "transaction",
    entityId: "tx-1",
    kind,
    localSnapshot: { id: "tx-1", amount: 25 },
    remoteSnapshot: kind === "DELETED_REMOTELY" ? {} : REMOTE,
    detectedAt: NOW,
  });

  return { outbox, conflicts, conflict };
}

describe("resolveLocalConflict", () => {
  let db: InMemoryDatabase;

  beforeEach(() => {
    db = new InMemoryDatabase();
    setLocalDatabasePort(db);
  });

  afterEach(resetLocalDatabasePort);

  it("keep-remote replaces the local record and drops the mutation", async () => {
    const { conflict } = await seed(db, "REMOTE_CHANGED");

    await resolveLocalConflict("owner-1", conflict.id, "keep-remote", NOW);

    const [row] = await db.select("transactions", { where: { id: "tx-1" } });
    const [stored] = await new LocalConflictRepository(db).listByOwner(
      "owner-1",
    );

    expect(row).toMatchObject({
      amount: 40,
      concept: "Cena",
      revision: 5,
      syncStatus: "synced",
    });
    await expect(
      new LocalOutboxRepository(db).listByOwner("owner-1"),
    ).resolves.toEqual([]);
    expect(stored).toMatchObject({ resolution: "keep-remote", resolvedAt: NOW });
  });

  it("keep-remote deletes the local row when the remote document is gone", async () => {
    const { conflict } = await seed(db, "DELETED_REMOTELY");

    await resolveLocalConflict("owner-1", conflict.id, "keep-remote", NOW);

    await expect(db.count("transactions")).resolves.toBe(0);
  });

  it("keep-mine rebases the mutation to the remote revision", async () => {
    const { conflict } = await seed(db, "REMOTE_CHANGED");

    await resolveLocalConflict("owner-1", conflict.id, "keep-mine", NOW);

    const [mutation] = await new LocalOutboxRepository(db).listByOwner(
      "owner-1",
    );
    const [row] = await db.select("transactions", { where: { id: "tx-1" } });

    expect(mutation).toMatchObject({
      status: "pending",
      baseRevision: 5,
      serverSnapshot: REMOTE,
      attempts: 0,
      nextAttemptAt: null,
      lastErrorCode: null,
    });
    expect(row.syncStatus).toBe("pending");
  });

  it("keep-mine re-creates an edit whose record was deleted remotely", async () => {
    const { conflict } = await seed(db, "DELETED_REMOTELY", "update");

    await resolveLocalConflict("owner-1", conflict.id, "keep-mine", NOW);

    const [mutation] = await new LocalOutboxRepository(db).listByOwner(
      "owner-1",
    );

    expect(mutation).toMatchObject({
      operation: "create",
      baseRevision: 0,
      serverSnapshot: {},
      status: "pending",
    });
  });

  it("keep-mine accepts a remote delete of a queued delete", async () => {
    const { conflict } = await seed(db, "DELETED_REMOTELY", "delete");

    await resolveLocalConflict("owner-1", conflict.id, "keep-mine", NOW);

    const [row] = await db.select("transactions", { where: { id: "tx-1" } });

    await expect(
      new LocalOutboxRepository(db).listByOwner("owner-1"),
    ).resolves.toEqual([]);
    expect(row.syncStatus).toBe("synced");
  });

  it("rejects an unsupported decision without touching the data", async () => {
    const { conflict } = await seed(db, "INSUFFICIENT_FUNDS");

    await expect(
      resolveLocalConflict("owner-1", conflict.id, "keep-mine", NOW),
    ).rejects.toThrow("SYNC_RESOLUTION_UNSUPPORTED");

    const [stored] = await new LocalConflictRepository(db).listOpen("owner-1");
    expect(stored.id).toBe(conflict.id);
  });

  it("rejects an unknown conflict id", async () => {
    await expect(
      resolveLocalConflict("owner-1", "missing", "keep-remote", NOW),
    ).rejects.toMatchObject({
      code: LOCAL_DB_ERROR_CODES.CONFLICT_NOT_FOUND,
    });
  });

  it("rejects when the local database is unavailable", async () => {
    setLocalDatabasePort(null);

    await expect(
      resolveLocalConflict("owner-1", "any", "keep-remote", NOW),
    ).rejects.toMatchObject({ code: LOCAL_DB_ERROR_CODES.OPEN_FAILED });
  });
});
