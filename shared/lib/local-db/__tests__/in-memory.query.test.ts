import { describe, expect, it } from "@jest/globals";

import { InMemoryDatabase } from "../in-memory.database";
import { buildRow } from "./db.fixtures";

describe("InMemoryDatabase queries", () => {
  it("filters by every where column", async () => {
    const db = new InMemoryDatabase();
    db.seed("wallets", [
      buildRow({ id: "w1", archivedAt: null }),
      buildRow({ id: "w2", archivedAt: "2026-01-01T00:00:00.000Z" }),
      buildRow({ id: "w3", ownerId: "owner-2", archivedAt: null }),
    ]);

    const mine = await db.select("wallets", { where: { ownerId: "owner-1" } });
    const archived = await db.select("wallets", {
      where: { ownerId: "owner-1", archivedAt: "2026-01-01T00:00:00.000Z" },
    });

    expect(mine.map((entry) => entry.id)).toEqual(["w1", "w2"]);
    expect(archived.map((entry) => entry.id)).toEqual(["w2"]);
  });

  it("matches a null filter against a missing column, like IS NULL", async () => {
    const db = new InMemoryDatabase();
    db.seed("wallets", [
      buildRow({ id: "w1", archivedAt: null }),
      buildRow({ id: "w2", archivedAt: "2026-01-01T00:00:00.000Z" }),
      buildRow({ id: "w3" }),
    ]);

    const rows = await db.select("wallets", { where: { archivedAt: null } });

    expect(rows.map((entry) => entry.id)).toEqual(["w1", "w3"]);
  });

  it("orders by multiple columns, mixing strings and numbers", async () => {
    const db = new InMemoryDatabase();
    db.seed("wallets", [
      buildRow({ id: "b", name: "Beta", sortOrder: 2 }),
      buildRow({ id: "a", name: "Alpha", sortOrder: 2 }),
      buildRow({ id: "c", name: "Alpha", sortOrder: 1 }),
    ]);

    const sorted = await db.select("wallets", {
      orderBy: [{ column: "sortOrder" }, { column: "name", direction: "desc" }],
    });
    const limited = await db.select("wallets", {
      orderBy: [{ column: "name", direction: "desc" }],
      limit: 2,
    });

    expect(sorted.map((entry) => entry.id)).toEqual(["c", "b", "a"]);
    expect(limited.map((entry) => entry.id)).toEqual(["b", "a"]);
  });

  it("sorts NULL first on ASC, like SQLite", async () => {
    const db = new InMemoryDatabase();
    db.seed("wallets", [
      buildRow({ id: "w2", archivedAt: "2026-02-01T00:00:00.000Z", name: "B" }),
      buildRow({ id: "w3", name: "C" }),
      buildRow({ id: "w1", archivedAt: "2026-01-01T00:00:00.000Z", name: "A" }),
    ]);

    const rows = await db.select("wallets", {
      orderBy: [{ column: "archivedAt" }, { column: "name" }],
    });

    expect(rows.map((entry) => entry.id)).toEqual(["w3", "w1", "w2"]);
  });

  it("sorts NULL last on DESC", async () => {
    const db = new InMemoryDatabase();
    db.seed("wallets", [
      buildRow({ id: "d1", archivedAt: "2026-01-01T00:00:00.000Z" }),
      buildRow({ id: "n1" }),
    ]);

    const rows = await db.select("wallets", {
      orderBy: [{ column: "archivedAt", direction: "desc" }],
    });

    expect(rows.map((entry) => entry.id)).toEqual(["d1", "n1"]);
  });

  it("returns every row when no options are given", async () => {
    const db = new InMemoryDatabase();
    db.seed("wallets", [buildRow({ id: "w1" }), buildRow({ id: "w2" })]);

    const rows = await db.select("wallets");
    const unsorted = await db.select("wallets", { orderBy: [] });

    expect(rows).toHaveLength(2);
    expect(unsorted).toHaveLength(2);
  });

  it("counts with and without a filter", async () => {
    const db = new InMemoryDatabase();
    db.seed("wallets", [buildRow({ id: "w1" }), buildRow({ id: "w2" })]);
    db.seed("transactions", []);

    await expect(db.count("wallets")).resolves.toBe(2);
    await expect(db.count("wallets", { id: "w2" })).resolves.toBe(1);
    await expect(db.count("transactions")).resolves.toBe(0);
  });
});
