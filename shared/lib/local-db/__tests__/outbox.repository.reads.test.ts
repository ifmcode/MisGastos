import { beforeEach, describe, expect, it } from "@jest/globals";

import { InMemoryDatabase } from "../in-memory.database";
import { LocalOutboxRepository } from "../local-outbox.repository";
import { buildInput, NOW } from "./outbox.fixtures";

describe("LocalOutboxRepository reads", () => {
  let repository: LocalOutboxRepository;

  beforeEach(async () => {
    repository = new LocalOutboxRepository(new InMemoryDatabase());

    await repository.enqueue(buildInput({ clientMutationId: "a", entityId: "t1" }));
    await repository.enqueue(buildInput({ clientMutationId: "b", entityId: "t2" }));
    await repository.enqueue(buildInput({ clientMutationId: "c", entityId: "t3" }));
    await repository.enqueue(buildInput({ clientMutationId: "d", entityId: "t4" }));

    await repository.markSyncing("owner-1", "a", NOW);
    await repository.markConflict("owner-1", "b", {
      errorCode: "REMOTE_CHANGED",
      now: NOW,
    });
    await repository.markFailed("owner-1", "c", {
      errorCode: "PERMISSION_DENIED",
      attempts: 1,
      nextAttemptAt: NOW,
      now: NOW,
    });
  });

  it("lists every mutation by seq", async () => {
    const rows = await repository.listByOwner("owner-1");

    expect(rows.map((row) => row.clientMutationId)).toEqual(["a", "b", "c", "d"]);
  });

  it("lists pending and failed rows only", async () => {
    const rows = await repository.listPending("owner-1");

    expect(rows.map((row) => row.clientMutationId)).toEqual(["c", "d"]);
  });

  it("counts pending work and conflicts separately", async () => {
    await expect(repository.countPending("owner-1")).resolves.toBe(2);
    await expect(repository.countConflicts("owner-1")).resolves.toBe(1);
    await expect(repository.countPending("owner-2")).resolves.toBe(0);
  });

  it("does not return the next mutation while the head is blocked", async () => {
    await expect(repository.getNext("owner-1", NOW)).resolves.toBeNull();
  });

  it("returns the head and releases a dependent mutation after the push", async () => {
    const fresh = new LocalOutboxRepository(new InMemoryDatabase());
    const wallet = await fresh.enqueue(
      buildInput({ entityType: "wallet", entityId: "w1", clientMutationId: "m-w" }),
    );
    await fresh.enqueue(
      buildInput({
        clientMutationId: "m-t",
        entityId: "tx-1",
        dependsOn: [{ entityType: "wallet", entityId: "w1" }],
      }),
    );

    await expect(fresh.getNext("owner-1", NOW)).resolves.toMatchObject({
      clientMutationId: "m-w",
    });

    await fresh.remove("owner-1", wallet.clientMutationId);

    await expect(fresh.getNext("owner-1", NOW)).resolves.toMatchObject({
      clientMutationId: "m-t",
      seq: 2,
    });
  });
});
