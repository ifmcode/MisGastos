import { beforeEach, describe, expect, it } from "@jest/globals";

import { InMemoryDatabase } from "../in-memory.database";
import { LocalOutboxRepository } from "../local-outbox.repository";
import { buildInput, LATER, NOW } from "./outbox.fixtures";

const WINDOW = "2026-11-20T10:10:00.000Z";
const AFTER_WINDOW = "2026-11-20T11:00:00.000Z";

describe("LocalOutboxRepository retry window", () => {
  let repository: LocalOutboxRepository;

  beforeEach(async () => {
    repository = new LocalOutboxRepository(new InMemoryDatabase());
    await repository.enqueue(buildInput({ clientMutationId: "m1" }));
    await repository.markFailed("owner-1", "m1", {
      errorCode: "UNAVAILABLE",
      attempts: 1,
      nextAttemptAt: WINDOW,
      now: NOW,
    });
  });

  it("blocks the queue until nextAttemptAt", async () => {
    await expect(repository.getNext("owner-1", NOW)).resolves.toBeNull();
  });

  it("returns the row once the retry window opens", async () => {
    await expect(repository.getNext("owner-1", WINDOW)).resolves.toMatchObject({
      clientMutationId: "m1",
      status: "failed",
    });
    await expect(repository.getNext("owner-1", AFTER_WINDOW)).resolves.toMatchObject({
      clientMutationId: "m1",
    });
  });
});

describe("LocalOutboxRepository permanent failure", () => {
  it("never retries a failure with nextAttemptAt null", async () => {
    const repository = new LocalOutboxRepository(new InMemoryDatabase());
    await repository.enqueue(buildInput({ clientMutationId: "m1" }));
    await repository.markFailed("owner-1", "m1", {
      errorCode: "PERMISSION_DENIED",
      attempts: 1,
      nextAttemptAt: null,
      now: NOW,
    });

    await expect(repository.getNext("owner-1", NOW)).resolves.toBeNull();
    await expect(
      repository.getNext("owner-1", "2030-01-01T00:00:00.000Z"),
    ).resolves.toBeNull();
  });
});

describe("LocalOutboxRepository reclaimInterrupted", () => {
  let repository: LocalOutboxRepository;

  beforeEach(async () => {
    repository = new LocalOutboxRepository(new InMemoryDatabase());
    await repository.enqueue(buildInput({ clientMutationId: "a", entityId: "t1" }));
    await repository.enqueue(buildInput({ clientMutationId: "b", entityId: "t2" }));
    await repository.enqueue(buildInput({ clientMutationId: "c", entityId: "t3" }));
    await repository.markSyncing("owner-1", "a", NOW);
    await repository.markSyncing("owner-1", "b", NOW);
  });

  it("moves interrupted rows back to pending and reports them", async () => {
    const reclaimed = await repository.reclaimInterrupted("owner-1", LATER);

    expect(reclaimed.map((row) => row.clientMutationId)).toEqual(["a", "b"]);
    expect(reclaimed.every((row) => row.status === "pending")).toBe(true);
    expect(reclaimed.every((row) => row.updatedAt === LATER)).toBe(true);
    await expect(repository.getNext("owner-1", LATER)).resolves.toMatchObject({
      clientMutationId: "a",
    });
  });

  it("returns an empty list when nothing was interrupted", async () => {
    await repository.reclaimInterrupted("owner-1", LATER);

    await expect(repository.reclaimInterrupted("owner-1", LATER)).resolves.toEqual(
      [],
    );
  });
});
