import { beforeEach, describe, expect, it } from "@jest/globals";

import { mirrorOwnerRows } from "../cache-mirror";
import { migrateLocalDatabase } from "../database";
import { InMemoryDatabase } from "../in-memory.database";
import type { LocalRow, LocalRecordSyncStatus } from "../local-db.types";
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

describe("mirrorOwnerRows", () => {
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

  it("upserts every incoming row as synced and forces the owner", async () => {
    await mirror([
      row({ id: "wallet-1", ownerId: "other", syncStatus: "pending" }),
      row({ id: "wallet-2" }),
    ]);

    const stored = await db.select<LocalRow>("wallets", {
      where: { ownerId: OWNER },
      orderBy: [{ column: "id" }],
    });

    expect(stored.map((current) => current.id)).toEqual([
      "wallet-1",
      "wallet-2",
    ]);
    expect(stored.every((current) => current.ownerId === OWNER)).toBe(true);
    expect(stored.every((current) => current.syncStatus === "synced")).toBe(
      true,
    );
  });

  it("deletes synced rows that are no longer in the remote list", async () => {
    db.seed("wallets", [
      row({ id: "wallet-1" }),
      row({ id: "wallet-2" }),
    ]);

    await mirror([row({ id: "wallet-2" })]);

    const stored = await db.select<LocalRow>("wallets", {
      where: { ownerId: OWNER },
    });

    expect(stored.map((current) => current.id)).toEqual(["wallet-2"]);
  });

  it.each<LocalRecordSyncStatus>([
    "pending",
    "syncing",
    "failed",
    "conflict",
  ])("never deletes a %s row missing from the pull", async (syncStatus) => {
    db.seed("wallets", [
      row({ id: "wallet-keep", syncStatus }),
      row({ id: "wallet-gone" }),
    ]);

    await mirror([row({ id: "wallet-new" })]);

    const stored = await db.select<LocalRow>("wallets", {
      where: { ownerId: OWNER },
    });
    const ids = stored.map((current) => current.id);

    expect(ids).toContain("wallet-keep");
    expect(ids).not.toContain("wallet-gone");
    expect(ids).toContain("wallet-new");
  });

  it("does not overwrite a protected row with the remote version", async () => {
    db.seed("wallets", [
      row({ id: "wallet-1", name: "Local", syncStatus: "pending" }),
    ]);

    await mirror([row({ id: "wallet-1", name: "Remote" })]);

    const [stored] = await db.select<LocalRow>("wallets", {
      where: { id: "wallet-1" },
    });

    expect(stored.name).toBe("Local");
    expect(stored.syncStatus).toBe("pending");
  });

  it("leaves another owner's rows untouched", async () => {
    db.seed("wallets", [
      row({ id: "wallet-b1", ownerId: "owner-2" }),
      row({ id: "wallet-b2", ownerId: "owner-2" }),
    ]);

    await mirror([row({ id: "wallet-a1" })]);

    const ownerB = await db.select<LocalRow>("wallets", {
      where: { ownerId: "owner-2" },
    });
    expect(ownerB.map((current) => current.id).sort()).toEqual([
      "wallet-b1",
      "wallet-b2",
    ]);

    const ownerA = await db.select<LocalRow>("wallets", {
      where: { ownerId: OWNER },
    });
    expect(ownerA.map((current) => current.id)).toEqual(["wallet-a1"]);
  });
});
