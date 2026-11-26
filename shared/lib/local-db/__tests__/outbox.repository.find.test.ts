import { beforeEach, describe, expect, it } from "@jest/globals";

import { InMemoryDatabase } from "../in-memory.database";
import { LocalOutboxRepository } from "../local-outbox.repository";
import { buildInput, NOW } from "./outbox.fixtures";

describe("LocalOutboxRepository find", () => {
  let db: InMemoryDatabase;
  let repository: LocalOutboxRepository;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    repository = new LocalOutboxRepository(db);

    await repository.enqueue(
      buildInput({
        clientMutationId: "m-tx",
        entityType: "transaction",
        entityId: "tx-1",
      }),
    );
    await repository.enqueue(
      buildInput({
        clientMutationId: "m-tr",
        entityType: "transfer",
        entityId: "transfer-1",
      }),
    );
  });

  it("finds the queued mutation of one entity", async () => {
    await expect(
      repository.find("owner-1", "transaction", "tx-1"),
    ).resolves.toMatchObject({ clientMutationId: "m-tx" });

    await expect(
      repository.find("owner-1", "transfer", "transfer-1"),
    ).resolves.toMatchObject({ clientMutationId: "m-tr" });
  });

  it("returns null when the entity has no queued mutation", async () => {
    await expect(
      repository.find("owner-1", "transaction", "missing"),
    ).resolves.toBeNull();
    await expect(
      repository.find("owner-2", "transaction", "tx-1"),
    ).resolves.toBeNull();
    await expect(
      repository.find("owner-1", "wallet", "tx-1"),
    ).resolves.toBeNull();
  });

  it("reads inside the caller's transaction without opening a nested one", async () => {
    const result = await db.transaction(async (tx) => {
      const [rows, mutation] = await Promise.all([
        repository.listByOwner("owner-1", tx),
        repository.find("owner-1", "transaction", "tx-1", tx),
      ]);

      return { rows, mutation };
    });

    expect(result.rows).toHaveLength(2);
    expect(result.mutation?.clientMutationId).toBe("m-tx");
  });

  it("keeps the seq order when listing through a transaction", async () => {
    await repository.enqueue(
      buildInput({ clientMutationId: "m-3", entityId: "tx-3", now: NOW }),
    );

    const rows = await db.transaction((tx) =>
      repository.listByOwner("owner-1", tx),
    );

    expect(rows.map((row) => row.seq)).toEqual([1, 2, 3]);
  });
});
