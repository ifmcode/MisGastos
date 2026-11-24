import { beforeEach, describe, expect, it } from "@jest/globals";

import { InMemoryDatabase } from "../in-memory.database";
import { LocalOutboxRepository } from "../local-outbox.repository";
import { buildInput, LATER, NOW } from "./outbox.fixtures";

describe("LocalOutboxRepository enqueue", () => {
  let db: InMemoryDatabase;
  let repository: LocalOutboxRepository;

  beforeEach(() => {
    db = new InMemoryDatabase();
    repository = new LocalOutboxRepository(db);
  });

  it("inserts the first mutation with seq 1 and pending state", async () => {
    const mutation = await repository.enqueue(buildInput());

    expect(mutation).toMatchObject({
      clientMutationId: "mutation-1",
      seq: 1,
      status: "pending",
      attempts: 0,
      createdAt: NOW,
      updatedAt: NOW,
    });
    await expect(repository.listByOwner("owner-1")).resolves.toEqual([mutation]);
  });

  it("increments seq per owner and starts over for another account", async () => {
    await repository.enqueue(buildInput({ entityId: "tx-1" }));
    const second = await repository.enqueue(
      buildInput({ entityId: "tx-2", clientMutationId: "mutation-2" }),
    );
    const otherOwner = await repository.enqueue(
      buildInput({
        ownerId: "owner-2",
        entityId: "tx-1",
        clientMutationId: "mutation-3",
      }),
    );

    expect(second.seq).toBe(2);
    expect(otherOwner.seq).toBe(1);
  });

  it("keeps seq growing after the queue drains", async () => {
    const first = await repository.enqueue(
      buildInput({ clientMutationId: "m1", entityId: "t1" }),
    );
    await repository.remove("owner-1", first.clientMutationId);

    const second = await repository.enqueue(
      buildInput({ clientMutationId: "m2", entityId: "t2" }),
    );

    expect(first.seq).toBe(1);
    expect(second.seq).toBe(2);
  });

  it("joins the transaction of the caller instead of opening one", async () => {
    const mutation = await db.transaction(async (tx) =>
      repository.enqueue(buildInput(), tx),
    );

    expect(mutation.seq).toBe(1);
    await expect(repository.listByOwner("owner-1")).resolves.toHaveLength(1);
  });

  it("coalesces into one row keeping the original id, seq and baseRevision", async () => {
    const created = await repository.enqueue(
      buildInput({ clientMutationId: "m-create", baseRevision: 3 }),
    );

    await repository.enqueue(
      buildInput({
        clientMutationId: "m-update",
        operation: "update",
        baseRevision: 9,
        localSnapshot: { amount: 25 },
        now: LATER,
      }),
    );

    const rows = await repository.listByOwner("owner-1");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      clientMutationId: "m-create",
      seq: created.seq,
      baseRevision: 3,
      operation: "create",
      localSnapshot: { amount: 25 },
      updatedAt: LATER,
    });
  });

  it("drops the row when a create is followed by a delete", async () => {
    await repository.enqueue(buildInput({ clientMutationId: "m-create" }));

    const dropped = await repository.enqueue(
      buildInput({
        clientMutationId: "m-delete",
        operation: "delete",
        now: LATER,
      }),
    );

    expect(dropped.clientMutationId).toBe("m-create");
    await expect(repository.listByOwner("owner-1")).resolves.toEqual([]);
    await expect(repository.countPending("owner-1")).resolves.toBe(0);
  });
});
