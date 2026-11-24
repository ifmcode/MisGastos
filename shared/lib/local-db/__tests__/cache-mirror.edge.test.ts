import { beforeEach, describe, expect, it } from "@jest/globals";

import { mirrorOwnerRows } from "../cache-mirror";
import { migrateLocalDatabase } from "../database";
import { InMemoryDatabase } from "../in-memory.database";
import type { LocalRow } from "../local-db.types";
import { buildRow } from "./db.fixtures";
import { NOW } from "./outbox.fixtures";

const OWNER = "owner-1";

function row(overrides: LocalRow = {}): LocalRow {
  return buildRow({
    ownerId: OWNER,
    name: "Cash",
    syncStatus: "synced",
    ...overrides,
  });
}

describe("mirrorOwnerRows edge cases", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
  });

  async function mirror(rows: readonly LocalRow[]): Promise<void> {
    await db.transaction((tx) =>
      mirrorOwnerRows(tx, { table: "wallets", ownerId: OWNER, rows, now: NOW }),
    );
  }

  it("stamps a missing updatedAt with the supplied now", async () => {
    const withoutUpdatedAt: LocalRow = {
      id: "wallet-1",
      ownerId: OWNER,
      name: "Cash",
      syncStatus: "synced",
    };

    await mirror([withoutUpdatedAt]);

    const [stored] = await db.select<LocalRow>("wallets", {
      where: { id: "wallet-1" },
    });

    expect(stored.updatedAt).toBe(NOW);
  });

  it("ignores incoming rows without an addressable id", async () => {
    await mirror([{ ownerId: OWNER, name: "No id" }]);

    await expect(db.count("wallets")).resolves.toBe(0);
  });

  it("does not delete a stored row that has no addressable id", async () => {
    db.seed("wallets", [row({ id: null, name: "Odd row" })]);

    await mirror([row({ id: "wallet-1" })]);

    const stored = await db.select<LocalRow>("wallets", {
      where: { id: null },
    });
    expect(stored).toHaveLength(1);
  });
});
