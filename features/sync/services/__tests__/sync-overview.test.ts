import { afterEach, describe, expect, it } from "@jest/globals";

import type { DatabasePort } from "@/shared/lib/local-db/database.port";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import { LocalConflictRepository } from "@/shared/lib/local-db/local-conflict.repository";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import { LocalSyncStateRepository } from "@/shared/lib/local-db/sync-state.repository";

import { readSyncOverview } from "../sync-overview";

const NOW = "2026-11-26T10:00:00.000Z";

async function seed(db: InMemoryDatabase) {
  await new LocalOutboxRepository(db).enqueue({
    clientMutationId: "m1",
    ownerId: "owner-1",
    entityType: "transaction",
    entityId: "tx-1",
    operation: "create",
    baseRevision: 0,
    localSnapshot: { id: "tx-1" },
    now: NOW,
  });
  await new LocalConflictRepository(db).create({
    ownerId: "owner-1",
    clientMutationId: "m2",
    entityType: "transaction",
    entityId: "tx-2",
    kind: "REMOTE_CHANGED",
    localSnapshot: {},
    remoteSnapshot: {},
    detectedAt: NOW,
  });
  await new LocalSyncStateRepository(db).save("owner-1", {
    lastPullAt: NOW,
    lastFullSyncAt: NOW,
    lastErrorCode: "unavailable",
  });
}

afterEach(resetLocalDatabasePort);

describe("readSyncOverview", () => {
  it("reports counters, last pull, error and open conflicts", async () => {
    const db = new InMemoryDatabase();
    setLocalDatabasePort(db);
    await seed(db);

    const overview = await readSyncOverview("owner-1");

    expect(overview).toMatchObject({
      pendingCount: 1,
      conflictCount: 1,
      lastSyncAt: NOW,
      lastErrorCode: "unavailable",
    });
    expect(overview.conflicts).toHaveLength(1);
  });

  it("isolates accounts", async () => {
    const db = new InMemoryDatabase();
    setLocalDatabasePort(db);
    await seed(db);

    await expect(readSyncOverview("owner-2")).resolves.toMatchObject({
      pendingCount: 0,
      conflictCount: 0,
      conflicts: [],
    });
  });

  it("returns empty defaults without a local database", async () => {
    setLocalDatabasePort(null);

    await expect(readSyncOverview("owner-1")).resolves.toMatchObject({
      pendingCount: 0,
      lastSyncAt: null,
    });
  });

  it("degrades to empty defaults when a read fails", async () => {
    const db = new InMemoryDatabase();
    const failing: DatabasePort = {
      upsert: (table, row) => db.upsert(table, row),
      update: (table, where, changes) => db.update(table, where, changes),
      delete: (table, where) => db.delete(table, where),
      select: (table, options) => db.select(table, options),
      count: async () => {
        throw new Error("boom");
      },
      transaction: (work) => db.transaction(work),
      executeStatements: (statements) => db.executeStatements(statements),
      setSchemaVersion: (version) => db.setSchemaVersion(version),
      getSchemaVersion: () => db.getSchemaVersion(),
      close: () => db.close(),
    };
    setLocalDatabasePort(failing);

    await expect(readSyncOverview("owner-1")).resolves.toMatchObject({
      pendingCount: 0,
      conflicts: [],
    });
  });
});
