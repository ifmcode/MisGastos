import { beforeEach, describe, expect, it } from "@jest/globals";

import { InMemoryDatabase } from "../in-memory.database";
import { LocalSyncStateRepository } from "../sync-state.repository";
import { LATER, NOW } from "./outbox.fixtures";

const DEFAULTS = {
  lastPullAt: null,
  lastPushAt: null,
  lastFullSyncAt: null,
  lastErrorCode: null,
};

describe("LocalSyncStateRepository", () => {
  let db: InMemoryDatabase;
  let repository: LocalSyncStateRepository;

  beforeEach(() => {
    db = new InMemoryDatabase();
    repository = new LocalSyncStateRepository(db);
  });

  it("returns all-null defaults for an unknown owner", async () => {
    await expect(repository.get("owner-1")).resolves.toEqual({
      ownerId: "owner-1",
      ...DEFAULTS,
    });
  });

  it("saves a partial patch and returns the merged record", async () => {
    await repository.save("owner-1", { lastPullAt: NOW });
    const merged = await repository.save("owner-1", { lastPushAt: LATER });

    expect(merged).toEqual({
      ownerId: "owner-1",
      lastPullAt: NOW,
      lastPushAt: LATER,
      lastFullSyncAt: null,
      lastErrorCode: null,
    });
    await expect(repository.get("owner-1")).resolves.toEqual(merged);
  });

  it("never writes undefined and keeps the stored value", async () => {
    await repository.save("owner-1", {
      lastFullSyncAt: NOW,
      lastErrorCode: "SYNC_OFFLINE",
    });

    const merged = await repository.save("owner-1", {
      lastFullSyncAt: undefined,
      lastPullAt: LATER,
    });

    expect(merged).toMatchObject({
      lastFullSyncAt: NOW,
      lastErrorCode: "SYNC_OFFLINE",
      lastPullAt: LATER,
    });
  });

  it("clears a field with an explicit null", async () => {
    await repository.save("owner-1", { lastErrorCode: "SYNC_OFFLINE" });

    const cleared = await repository.save("owner-1", { lastErrorCode: null });

    expect(cleared.lastErrorCode).toBeNull();
    await expect(repository.get("owner-1")).resolves.toMatchObject({
      lastErrorCode: null,
    });
  });

  it("isolates accounts", async () => {
    await repository.save("owner-1", { lastPullAt: NOW });

    await expect(repository.get("owner-2")).resolves.toEqual({
      ownerId: "owner-2",
      ...DEFAULTS,
    });
    await expect(repository.get("owner-1")).resolves.toMatchObject({
      lastPullAt: NOW,
    });
  });

  it("joins the transaction of the caller", async () => {
    const merged = await db.transaction(async (tx) =>
      repository.save("owner-1", { lastPullAt: NOW }, tx),
    );

    expect(merged.lastPullAt).toBe(NOW);
    await expect(repository.get("owner-1")).resolves.toMatchObject({
      lastPullAt: NOW,
    });
  });
});
