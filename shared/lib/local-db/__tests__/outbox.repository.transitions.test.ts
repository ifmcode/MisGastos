import { beforeEach, describe, expect, it } from "@jest/globals";

import { InMemoryDatabase } from "../in-memory.database";
import { LOCAL_DB_ERROR_CODES, LocalDbError } from "../local-db.errors";
import { LocalOutboxRepository } from "../local-outbox.repository";
import { buildInput, LATER, NOW } from "./outbox.fixtures";

const NOT_FOUND = expect.objectContaining({
  code: LOCAL_DB_ERROR_CODES.OUTBOX_MUTATION_NOT_FOUND,
});

describe("LocalOutboxRepository transitions", () => {
  let db: InMemoryDatabase;
  let repository: LocalOutboxRepository;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    repository = new LocalOutboxRepository(db);
    await repository.enqueue(buildInput());
  });

  it("marks a pending mutation as syncing and counts the send", async () => {
    const syncing = await repository.markSyncing("owner-1", "mutation-1", LATER);

    expect(syncing).toMatchObject({
      status: "syncing",
      attempts: 1,
      updatedAt: LATER,
    });
    await expect(repository.getNext("owner-1", NOW)).resolves.toBeNull();
  });

  it("marks a mutation as failed with retry data", async () => {
    const failed = await repository.markFailed("owner-1", "mutation-1", {
      errorCode: "PERMISSION_DENIED",
      attempts: 2,
      nextAttemptAt: LATER,
      now: LATER,
    });

    expect(failed).toMatchObject({
      status: "failed",
      attempts: 2,
      nextAttemptAt: LATER,
      lastErrorCode: "PERMISSION_DENIED",
      updatedAt: LATER,
    });

    const [stored] = await repository.listByOwner("owner-1");
    expect(stored).toMatchObject({ attempts: 2, lastErrorCode: "PERMISSION_DENIED" });
  });

  it("joins the transaction of the caller when marking a failure", async () => {
    const failed = await db.transaction(async (tx) =>
      repository.markFailed(
        "owner-1",
        "mutation-1",
        {
          errorCode: "UNAVAILABLE",
          attempts: 1,
          nextAttemptAt: LATER,
          now: LATER,
        },
        tx,
      ),
    );

    expect(failed.status).toBe("failed");
    await expect(repository.remove("owner-1", "mutation-1")).resolves.toBeUndefined();
  });

  it("marks a syncing mutation as failed or conflict", async () => {
    await repository.markSyncing("owner-1", "mutation-1", NOW);
    const failed = await repository.markFailed("owner-1", "mutation-1", {
      errorCode: "UNAVAILABLE",
      attempts: 1,
      nextAttemptAt: null,
      now: LATER,
    });
    expect(failed.status).toBe("failed");

    const other = new LocalOutboxRepository(db);
    await other.enqueue(buildInput({ entityId: "tx-2", clientMutationId: "m2" }));
    await other.markSyncing("owner-1", "m2", NOW);
    const conflict = await other.markConflict("owner-1", "m2", {
      errorCode: "REMOTE_CHANGED",
      now: LATER,
    });
    expect(conflict).toMatchObject({
      status: "conflict",
      lastErrorCode: "REMOTE_CHANGED",
    });
  });

  it("rejects a transition the state machine forbids", async () => {
    await repository.markConflict("owner-1", "mutation-1", {
      errorCode: "REMOTE_CHANGED",
      now: LATER,
    });

    await expect(
      repository.markSyncing("owner-1", "mutation-1", LATER),
    ).rejects.toMatchObject({
      code: LOCAL_DB_ERROR_CODES.OUTBOX_INVALID_TRANSITION,
    });
  });

  it("throws OUTBOX_MUTATION_NOT_FOUND for unknown ids", async () => {
    await expect(
      repository.markSyncing("owner-1", "missing", NOW),
    ).rejects.toEqual(NOT_FOUND);
    await expect(
      repository.markFailed("owner-1", "missing", {
        errorCode: "UNAVAILABLE",
        attempts: 1,
        nextAttemptAt: null,
        now: NOW,
      }),
    ).rejects.toEqual(NOT_FOUND);
    await expect(
      repository.markConflict("owner-1", "missing", {
        errorCode: "REMOTE_CHANGED",
        now: NOW,
      }),
    ).rejects.toEqual(NOT_FOUND);
    await expect(repository.remove("owner-1", "missing")).rejects.toEqual(
      NOT_FOUND,
    );
  });

  it("removes the row after a successful push", async () => {
    await repository.remove("owner-1", "mutation-1");

    await expect(repository.listByOwner("owner-1")).resolves.toEqual([]);
    await expect(repository.remove("owner-1", "mutation-1")).rejects.toBeInstanceOf(
      LocalDbError,
    );
  });
});
