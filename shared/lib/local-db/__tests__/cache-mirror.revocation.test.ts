import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { mirrorOwnerRows, mirrorSingleRow } from "../cache-mirror";
import { migrateLocalDatabase } from "../database";
import { InMemoryDatabase } from "../in-memory.database";
import type { LocalRow } from "../local-db.types";
import { allowOwnerLocalWrites, revokeOwnerLocalWrites } from "../owner-revocation";
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

describe("mirroring a revoked owner", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
  });

  afterEach(() => {
    allowOwnerLocalWrites(OWNER);
  });

  it("neither upserts nor deletes rows of a remote list read", async () => {
    db.seed("wallets", [
      row({ id: "wallet-1", name: "Local" }),
      row({ id: "wallet-2" }),
    ]);
    revokeOwnerLocalWrites(OWNER);

    await db.transaction((tx) =>
      mirrorOwnerRows(tx, {
        table: "wallets",
        ownerId: OWNER,
        rows: [row({ id: "wallet-1", name: "Remote" }), row({ id: "wallet-3" })],
        now: NOW,
      }),
    );

    const stored = await db.select<LocalRow>("wallets", {
      where: { ownerId: OWNER },
      orderBy: [{ column: "id" }],
    });

    expect(stored.map((current) => current.id)).toEqual([
      "wallet-1",
      "wallet-2",
    ]);
    expect(stored.map((current) => current.name)).toEqual(["Local", "Cash"]);
  });

  it("does not upsert a single row", async () => {
    revokeOwnerLocalWrites(OWNER);

    await db.transaction((tx) =>
      mirrorSingleRow(tx, {
        table: "wallets",
        ownerId: OWNER,
        row: row({ id: "wallet-1" }),
        now: NOW,
      }),
    );

    await expect(db.count("wallets", { ownerId: OWNER })).resolves.toBe(0);
  });

  it("blocks a social table too", async () => {
    db.seed("groups", [row({ id: "group-1", name: "Local" })]);
    revokeOwnerLocalWrites(OWNER);

    await db.transaction((tx) =>
      mirrorOwnerRows(tx, {
        table: "groups",
        ownerId: OWNER,
        rows: [row({ id: "group-1", name: "Remote" }), row({ id: "group-2" })],
        now: NOW,
      }),
    );

    const stored = await db.select<LocalRow>("groups", {
      where: { ownerId: OWNER },
    });

    expect(stored.map((current) => current.id)).toEqual(["group-1"]);
    expect(stored[0].name).toBe("Local");
  });

  it("mirrors again once the account lifts the revocation", async () => {
    revokeOwnerLocalWrites(OWNER);
    allowOwnerLocalWrites(OWNER);

    await db.transaction((tx) =>
      mirrorSingleRow(tx, {
        table: "wallets",
        ownerId: OWNER,
        row: row({ id: "wallet-1" }),
        now: NOW,
      }),
    );

    await expect(db.count("wallets", { ownerId: OWNER })).resolves.toBe(1);
  });
});
