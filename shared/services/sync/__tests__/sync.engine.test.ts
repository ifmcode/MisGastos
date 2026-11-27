import { describe, expect, it, jest } from "@jest/globals";

import type { OutboxMutation } from "@/shared/lib/local-db/local-db.types";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import { OfflineReadError } from "@/shared/lib/local-db/offline-read";
import { LocalSyncStateRepository } from "@/shared/lib/local-db/sync-state.repository";
import {
  buildInput,
  NOW,
} from "@/shared/lib/local-db/__tests__/outbox.fixtures";
import { outboxMutationToRow } from "@/shared/lib/local-db/outbox.mapper";
import type {
  RemoteMutationExecutor,
  RemoteMutationOutcome,
  RemoteWalletBalance,
} from "@/shared/services/sync/sync.types";
import type { SyncMutationApplier } from "@/shared/services/sync/sync.applier.types";

import { SyncEngine } from "../sync.engine";

const WALLETS: RemoteWalletBalance[] = [
  { id: "wallet-1", balance: 75, revision: 2 },
];

function setup(outcomes: RemoteMutationOutcome[]) {
  const db = new InMemoryDatabase();
  const outbox = new LocalOutboxRepository(db);
  const queue = [...outcomes];
  const executor: RemoteMutationExecutor = {
    execute: jest.fn<RemoteMutationExecutor["execute"]>(async (_mutation) => {
      const next = queue.shift();
      if (!next) throw new Error("unexpected execute");
      return next;
    }),
  };
  const applier: SyncMutationApplier = {
    applySuccess: jest.fn<SyncMutationApplier["applySuccess"]>(
      async ({ ownerId, mutation }) => {
        await outbox.remove(ownerId, mutation.clientMutationId);
      },
    ),
    applyConflict: jest.fn<SyncMutationApplier["applyConflict"]>(
      async ({ ownerId, mutation, errorCode }) => {
        await outbox.markConflict(ownerId, mutation.clientMutationId, {
          errorCode,
          now: NOW,
        });
      },
    ),
    applyFailure: jest.fn<SyncMutationApplier["applyFailure"]>(
      async ({ ownerId, mutation, errorCode, attempts, nextAttemptAt }) => {
        await outbox.markFailed(ownerId, mutation.clientMutationId, {
          errorCode,
          attempts,
          nextAttemptAt,
          now: NOW,
        });
      },
    ),
  };
  const pull = jest.fn<(ownerId: string) => Promise<void>>(
    async () => undefined,
  );
  const engine = new SyncEngine({
    getPort: async () => db,
    now: () => NOW,
    executor,
    applier,
    pull,
    random: () => 0.5,
  });

  return { db, outbox, executor, applier, pull, engine };
}

async function seed(outbox: LocalOutboxRepository, total: number) {
  for (let index = 1; index <= total; index += 1) {
    await outbox.enqueue(
      buildInput({
        clientMutationId: `mutation-${index}`,
        entityId: `tx-${index}`,
      }),
    );
  }
}

const APPLIED: RemoteMutationOutcome = {
  status: "applied",
  revisionAfter: 1,
  wallets: WALLETS,
};

describe("SyncEngine", () => {
  it("pushes the queue in order, pulls and reports the cycle", async () => {
    const context = setup([APPLIED, APPLIED]);
    await seed(context.outbox, 2);

    const result = await context.engine.sync("owner-1");

    expect(context.executor.execute).toHaveBeenCalledTimes(2);
    expect(context.applier.applySuccess).toHaveBeenCalledTimes(2);
    expect(context.pull).toHaveBeenCalledWith("owner-1");
    expect(result).toMatchObject({
      status: "done",
      pushed: 2,
      conflicts: 0,
      failed: 0,
      pulled: true,
      pending: 0,
      errorCode: null,
    });
    await expect(context.outbox.listByOwner("owner-1")).resolves.toEqual([]);
  });

  it("counts a replay as pushed", async () => {
    const context = setup([
      { status: "replayed", revisionAfter: 3, wallets: [] },
    ]);
    await seed(context.outbox, 1);

    const result = await context.engine.sync("owner-1");

    expect(result.pushed).toBe(1);
    expect(context.applier.applySuccess).toHaveBeenCalledWith(
      expect.objectContaining({ revisionAfter: 3 }),
    );
  });

  it("stops the queue on a conflict and still pulls", async () => {
    const context = setup([
      {
        status: "conflict",
        kind: "REMOTE_CHANGED",
        errorCode: "SYNC_REMOTE_CHANGED",
        remoteSnapshot: { revision: 4 },
      },
    ]);
    await seed(context.outbox, 2);

    const result = await context.engine.sync("owner-1");

    expect(context.executor.execute).toHaveBeenCalledTimes(1);
    expect(context.applier.applyConflict).toHaveBeenCalledTimes(1);
    expect(context.pull).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ status: "blocked", conflicts: 1 });
    await expect(context.outbox.countConflicts("owner-1")).resolves.toBe(1);
  });

  it("pauses with backoff on a transient error and skips the pull", async () => {
    const context = setup([{ status: "retry", errorCode: "unavailable" }]);
    await seed(context.outbox, 2);

    const result = await context.engine.sync("owner-1");

    expect(context.executor.execute).toHaveBeenCalledTimes(1);
    expect(context.applier.applyFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        attempts: 1,
        nextAttemptAt: "2026-11-20T10:00:01.000Z",
      }),
    );
    expect(context.pull).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: "blocked",
      pulled: false,
      errorCode: "unavailable",
    });
  });

  it("defers the pull instead of failing when Firestore serves a cached empty snapshot", async () => {
    const context = setup([]);
    context.pull.mockRejectedValueOnce(new OfflineReadError());

    const result = await context.engine.sync("owner-1");

    expect(result).toMatchObject({
      status: "done",
      pulled: false,
      deferred: true,
      errorCode: null,
    });

    // The technical code is never persisted, so the sync center cannot paint it.
    const state = await new LocalSyncStateRepository(context.db).get("owner-1");
    expect(state.lastErrorCode).toBeNull();
    expect(state.lastPullAt).toBeNull();
  });

  it("keeps a permanent failure manual (no retry window)", async () => {    const context = setup([{ status: "failed", errorCode: "permission-denied" }]);
    await seed(context.outbox, 1);

    const result = await context.engine.sync("owner-1");

    expect(context.applier.applyFailure).toHaveBeenCalledWith(
      expect.objectContaining({ nextAttemptAt: null }),
    );
    expect(context.pull).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ status: "blocked", failed: 1 });
  });

  it("is single-flight per account", async () => {
    const context = setup([APPLIED]);
    await seed(context.outbox, 1);

    const first = context.engine.sync("owner-1");
    const second = context.engine.sync("owner-1");

    expect(first).toBe(second);
    await first;
    expect(context.executor.execute).toHaveBeenCalledTimes(1);
  });

  it("reports offline when there is no local database", async () => {
    const engine = new SyncEngine({
      getPort: async () => null,
      now: () => NOW,
      executor: { execute: jest.fn<RemoteMutationExecutor["execute"]>() },
      applier: {
        applySuccess: jest.fn<SyncMutationApplier["applySuccess"]>(),
        applyConflict: jest.fn<SyncMutationApplier["applyConflict"]>(),
        applyFailure: jest.fn<SyncMutationApplier["applyFailure"]>(),
      },
      pull: jest.fn<(ownerId: string) => Promise<void>>(),
    });

    await expect(engine.sync("owner-1")).resolves.toMatchObject({
      status: "offline",
      errorCode: "SYNC_OFFLINE",
    });
  });

  it("reclaims a mutation left syncing by a crash", async () => {    const context = setup([APPLIED]);
    await context.db.upsert(
      "outbox",
      outboxMutationToRow({
        clientMutationId: "mutation-1",
        ownerId: "owner-1",
        seq: 1,
        entityType: "transaction",
        entityId: "tx-1",
        operation: "create",
        baseRevision: 0,
        localSnapshot: { amount: 10 },
        serverSnapshot: {},
        dependsOn: [],
        status: "syncing",
        attempts: 0,
        nextAttemptAt: null,
        lastErrorCode: null,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const result = await context.engine.sync("owner-1");

    expect(result.pushed).toBe(1);
    await expect(context.outbox.listByOwner("owner-1")).resolves.toEqual([]);
  });

  it("does not push a permanent failure until a manual retry", async () => {
    const context = setup([APPLIED]);
    await seed(context.outbox, 1);
    await context.outbox.markFailed("owner-1", "mutation-1", {
      errorCode: "permission-denied",
      attempts: 1,
      nextAttemptAt: null,
      now: NOW,
    });

    const automatic = await context.engine.sync("owner-1");
    expect(automatic.pushed).toBe(0);
    expect(context.executor.execute).not.toHaveBeenCalled();

    const manual = await context.engine.sync("owner-1", { manual: true });
    expect(manual.pushed).toBe(1);
    await expect(context.outbox.listByOwner("owner-1")).resolves.toEqual([]);
  });
});
