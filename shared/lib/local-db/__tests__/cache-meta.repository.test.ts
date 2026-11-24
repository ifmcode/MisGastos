import { beforeEach, describe, expect, it } from "@jest/globals";

import { LocalCacheMetaRepository } from "../cache-meta.repository";
import { migrateLocalDatabase } from "../database";
import { InMemoryDatabase } from "../in-memory.database";
import { LATER, NOW } from "./outbox.fixtures";

describe("LocalCacheMetaRepository", () => {
  let db: InMemoryDatabase;
  let repository: LocalCacheMetaRepository;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    repository = new LocalCacheMetaRepository(db);
  });

  it("returns null for a collection that was never fetched", async () => {
    await expect(repository.getFetchedAt("owner-1", "wallets")).resolves.toBeNull();
  });

  it("stores and returns the fetch timestamp", async () => {
    await repository.markFetched("owner-1", "wallets", NOW);

    await expect(repository.getFetchedAt("owner-1", "wallets")).resolves.toBe(
      NOW,
    );
  });

  it("overwrites the timestamp of a later fetch", async () => {
    await repository.markFetched("owner-1", "wallets", NOW);
    await repository.markFetched("owner-1", "wallets", LATER);

    await expect(repository.getFetchedAt("owner-1", "wallets")).resolves.toBe(
      LATER,
    );
  });

  it("isolates owners and collections", async () => {
    await repository.markFetched("owner-1", "wallets", NOW);
    await repository.markFetched("owner-1", "transactions", LATER);
    await repository.markFetched("owner-2", "wallets", LATER);

    await expect(repository.getFetchedAt("owner-1", "wallets")).resolves.toBe(
      NOW,
    );
    await expect(
      repository.getFetchedAt("owner-1", "transactions"),
    ).resolves.toBe(LATER);
    await expect(repository.getFetchedAt("owner-2", "wallets")).resolves.toBe(
      LATER,
    );
    await expect(
      repository.getFetchedAt("owner-2", "transactions"),
    ).resolves.toBeNull();
  });

  it("joins the transaction of the caller", async () => {
    await db.transaction((tx) =>
      repository.markFetched("owner-1", "wallets", NOW, tx),
    );

    await expect(repository.getFetchedAt("owner-1", "wallets")).resolves.toBe(
      NOW,
    );
  });
});
