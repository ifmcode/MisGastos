import { beforeEach, describe, expect, it } from "@jest/globals";

import { InMemoryDatabase } from "../in-memory.database";
import { LOCAL_DB_ERROR_CODES, LocalDbError } from "../local-db.errors";
import { LocalConflictRepository } from "../local-conflict.repository";

const NOW = "2026-11-26T10:00:00.000Z";
const LATER = "2026-11-26T10:05:00.000Z";

function buildInput(overrides: Record<string, unknown> = {}) {
  return {
    ownerId: "owner-1",
    clientMutationId: "mutation-1",
    entityType: "transaction" as const,
    entityId: "tx-1",
    kind: "REMOTE_CHANGED" as const,
    localSnapshot: { amount: 25 },
    remoteSnapshot: { amount: 30, revision: 4 },
    detectedAt: NOW,
    ...overrides,
  };
}

describe("LocalConflictRepository", () => {
  let db: InMemoryDatabase;
  let repository: LocalConflictRepository;

  beforeEach(() => {
    db = new InMemoryDatabase();
    repository = new LocalConflictRepository(db);
  });

  it("creates a conflict with a deterministic id and no resolution", async () => {
    const conflict = await repository.create(buildInput());

    expect(conflict).toMatchObject({
      id: "owner-1__mutation-1",
      resolvedAt: null,
      resolution: null,
      remoteSnapshot: { amount: 30, revision: 4 },
    });
    await expect(repository.listOpen("owner-1")).resolves.toEqual([conflict]);
    await expect(repository.countOpen("owner-1")).resolves.toBe(1);
  });

  it("keeps both snapshots and refreshes the open row on re-creation", async () => {
    await repository.create(buildInput());
    const refreshed = await repository.create(
      buildInput({ remoteSnapshot: { amount: 40, revision: 5 } }),
    );

    expect(refreshed.remoteSnapshot).toEqual({ amount: 40, revision: 5 });
    await expect(repository.listByOwner("owner-1")).resolves.toHaveLength(1);
  });

  it("resolves explicitly and keeps the evidence out of the open list", async () => {
    const created = await repository.create(buildInput());
    const resolved = await repository.resolve(
      "owner-1",
      created.id,
      "keep-remote",
      LATER,
    );

    expect(resolved).toMatchObject({
      resolvedAt: LATER,
      resolution: "keep-remote",
    });
    await expect(repository.listOpen("owner-1")).resolves.toEqual([]);
    await expect(repository.countOpen("owner-1")).resolves.toBe(0);
    await expect(repository.listByOwner("owner-1")).resolves.toHaveLength(1);
  });

  it("rejects resolving an unknown conflict", async () => {
    await expect(
      repository.resolve("owner-1", "missing", "keep-mine", LATER),
    ).rejects.toMatchObject({
      code: LOCAL_DB_ERROR_CODES.CONFLICT_NOT_FOUND,
    });
  });

  it("finds by mutation and by id, scoped by owner", async () => {
    const created = await repository.create(buildInput());

    await expect(
      repository.findByMutation("owner-1", "mutation-1"),
    ).resolves.toMatchObject({ id: created.id });
    await expect(
      repository.findById("owner-1", created.id),
    ).resolves.toMatchObject({ clientMutationId: "mutation-1" });
    await expect(
      repository.findByMutation("owner-2", "mutation-1"),
    ).resolves.toBeNull();
    await expect(repository.findById("owner-2", created.id)).resolves.toBeNull();
  });

  it("removes only that account's conflicts", async () => {
    await repository.create(buildInput());
    await repository.create(buildInput({ ownerId: "owner-2" }));

    await repository.removeByOwner("owner-1");

    await expect(repository.listByOwner("owner-1")).resolves.toEqual([]);
    await expect(repository.listByOwner("owner-2")).resolves.toHaveLength(1);
  });

  it("joins the caller transaction and rolls back with it", async () => {
    await expect(
      db.transaction(async (tx) => {
        await repository.create(buildInput(), tx);
        throw new Error("rollback");
      }),
    ).rejects.toThrow("rollback");

    await expect(repository.listByOwner("owner-1")).resolves.toEqual([]);
  });

  it("degrades malformed snapshots instead of throwing", async () => {
    await db.seed("conflicts", [
      {
        id: "broken",
        ownerId: "owner-1",
        clientMutationId: "m",
        entityType: "nope",
        entityId: "e",
        kind: "nope",
        localSnapshot: "{oops",
        remoteSnapshot: "[]",
        detectedAt: NOW,
        resolvedAt: null,
        resolution: "weird",
      },
    ]);

    const [conflict] = await repository.listByOwner("owner-1");

    expect(conflict).toMatchObject({
      entityType: "transaction",
      kind: "INVALID",
      localSnapshot: {},
      remoteSnapshot: {},
      resolution: null,
    });
  });

  it("throws a typed error when the write is invalid", async () => {
    const error = new LocalDbError(LOCAL_DB_ERROR_CODES.CONFLICT_NOT_FOUND);

    expect(error.code).toBe("SYNC_CONFLICT_NOT_FOUND");
  });
});
