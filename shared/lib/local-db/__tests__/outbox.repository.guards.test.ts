import { beforeEach, describe, expect, it } from "@jest/globals";

import { InMemoryDatabase } from "../in-memory.database";
import { LOCAL_DB_ERROR_CODES } from "../local-db.errors";
import { LocalOutboxRepository } from "../local-outbox.repository";
import { buildInput, LATER, NOW } from "./outbox.fixtures";

const IN_FLIGHT = expect.objectContaining({
  code: LOCAL_DB_ERROR_CODES.OUTBOX_MUTATION_IN_FLIGHT,
});
const CONFLICT = expect.objectContaining({
  code: LOCAL_DB_ERROR_CODES.OUTBOX_CONFLICT_UNRESOLVED,
});

describe("LocalOutboxRepository enqueue guards", () => {
  let repository: LocalOutboxRepository;

  beforeEach(async () => {
    repository = new LocalOutboxRepository(new InMemoryDatabase());
    await repository.enqueue(buildInput({ clientMutationId: "m1" }));
  });

  it("refuses to replace a mutation that is being pushed", async () => {
    await repository.markSyncing("owner-1", "m1", NOW);

    await expect(
      repository.enqueue(
        buildInput({ clientMutationId: "m2", operation: "update" }),
      ),
    ).rejects.toEqual(IN_FLIGHT);

    const [stored] = await repository.listByOwner("owner-1");
    expect(stored).toMatchObject({ clientMutationId: "m1", status: "syncing" });
  });

  it("refuses to drop an in-flight create", async () => {
    await repository.markSyncing("owner-1", "m1", NOW);

    await expect(
      repository.enqueue(
        buildInput({ clientMutationId: "m2", operation: "delete", now: LATER }),
      ),
    ).rejects.toEqual(IN_FLIGHT);

    await expect(repository.countPending("owner-1")).resolves.toBe(0);
  });

  it("refuses to replace a mutation with an unresolved conflict", async () => {
    await repository.markConflict("owner-1", "m1", {
      errorCode: "REMOTE_CHANGED",
      now: NOW,
    });

    await expect(
      repository.enqueue(
        buildInput({ clientMutationId: "m2", operation: "update" }),
      ),
    ).rejects.toEqual(CONFLICT);

    await expect(repository.countConflicts("owner-1")).resolves.toBe(1);
  });
});
