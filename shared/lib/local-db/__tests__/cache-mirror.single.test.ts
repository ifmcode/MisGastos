import { beforeEach, describe, expect, it } from "@jest/globals";

import { mirrorSingleRow } from "../cache-mirror";
import { migrateLocalDatabase } from "../database";
import { InMemoryDatabase } from "../in-memory.database";
import type { LocalCacheCollection, LocalRow } from "../local-db.types";
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

describe("mirrorSingleRow", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
  });

  async function mirror(
    rowToMirror: LocalRow,
    table: LocalCacheCollection = "wallets",
  ): Promise<void> {
    await db.transaction((tx) =>
      mirrorSingleRow(tx, {
        table,
        ownerId: OWNER,
        row: rowToMirror,
        now: NOW,
      }),
    );
  }

  it("upserts one row without deleting others or stamping the collection", async () => {
    db.seed("wallets", [row({ id: "wallet-keep" })]);

    await mirror(row({ id: "wallet-1", name: "Remote" }));

    const stored = await db.select<LocalRow>("wallets", {
      where: { ownerId: OWNER },
    });
    expect(stored.map((current) => current.id).sort()).toEqual([
      "wallet-1",
      "wallet-keep",
    ]);
    await expect(db.count("cacheMeta")).resolves.toBe(0);
  });

  it("does not overwrite a protected stored row", async () => {
    db.seed("wallets", [
      row({ id: "wallet-1", name: "Local", syncStatus: "pending" }),
    ]);

    await mirror(row({ id: "wallet-1", name: "Remote" }));

    const [stored] = await db.select<LocalRow>("wallets", {
      where: { id: "wallet-1" },
    });
    expect(stored.name).toBe("Local");
    expect(stored.syncStatus).toBe("pending");
  });

  it("ignores a row without an addressable id", async () => {
    await mirror({ ownerId: OWNER, name: "No id" });

    await expect(db.count("wallets")).resolves.toBe(0);
  });

  it("does not let another owner's protected row with the same id block the mirror", async () => {
    db.seed("groups", [
      row({
        id: "group-1",
        ownerId: "owner-2",
        name: "Other",
        syncStatus: "pending",
      }),
    ]);

    await mirror(row({ id: "group-1", name: "Mine" }), "groups");

    const [stored] = await db.select<LocalRow>("groups", {
      where: { ownerId: OWNER },
    });
    expect(stored).toMatchObject({ name: "Mine", syncStatus: "synced" });

    const [other] = await db.select<LocalRow>("groups", {
      where: { ownerId: "owner-2" },
    });
    expect(other).toMatchObject({ name: "Other", syncStatus: "pending" });
  });
});
