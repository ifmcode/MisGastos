import { describe, expect, it } from "@jest/globals";

import {
  buildCount,
  buildDelete,
  buildSelect,
  buildUpdate,
  buildUpsert,
  quoteIdentifier,
} from "../expo-sqlite.sql";

describe("quoteIdentifier", () => {
  it("quotes names and escapes embedded quotes", () => {
    expect(quoteIdentifier("ownerId")).toBe('"ownerId"');
    expect(quoteIdentifier('weird"name')).toBe('"weird""name"');
  });
});

describe("buildSelect", () => {
  it("selects the whole table by default", () => {
    expect(buildSelect("wallets")).toEqual({
      sql: 'SELECT * FROM "wallets"',
      params: {},
    });
  });

  it("binds the where, order and limit clauses", () => {
    expect(
      buildSelect("wallets", {
        where: { ownerId: "owner-1", archivedAt: null },
        orderBy: [
          { column: "createdAt", direction: "desc" },
          { column: "name" },
        ],
        limit: 5,
      }),
    ).toEqual({
      sql:
        'SELECT * FROM "wallets" WHERE "ownerId" IS $w0 AND "archivedAt" IS $w1' +
        ' ORDER BY "createdAt" DESC, "name" ASC LIMIT $limit',
      params: { $w0: "owner-1", $w1: null, $limit: 5 },
    });
  });
});

describe("buildUpsert", () => {
  it("inserts and updates the non-key columns on primary-key conflict", () => {
    const statement = buildUpsert("outbox", {
      clientMutationId: "m1",
      seq: 2,
    });

    expect(statement).toEqual({
      sql:
        'INSERT INTO "outbox" ("clientMutationId", "seq") VALUES ($v0, $v1)' +
        ' ON CONFLICT ("clientMutationId") DO UPDATE SET "seq" = excluded."seq"',
      params: { $v0: "m1", $v1: 2 },
    });
    expect(statement.sql).not.toContain("REPLACE");
  });

  it("does nothing when the row only carries its primary key", () => {
    expect(buildUpsert("syncState", { ownerId: "o1" })).toEqual({
      sql:
        'INSERT INTO "syncState" ("ownerId") VALUES ($v0)' +
        ' ON CONFLICT ("ownerId") DO NOTHING',
      params: { $v0: "o1" },
    });
  });
});

describe("buildUpdate", () => {
  it("separates assignment and filter parameters", () => {
    expect(
      buildUpdate("wallets", { id: "w1" }, { name: "Pocket", balance: 3.5 }),
    ).toEqual({
      sql:
        'UPDATE "wallets" SET "name" = $s0, "balance" = $s1 WHERE "id" IS $w0',
      params: { $s0: "Pocket", $s1: 3.5, $w0: "w1" },
    });
  });
});

describe("buildDelete", () => {
  it("builds a filtered delete", () => {
    expect(buildDelete("outbox", { ownerId: "o1" })).toEqual({
      sql: 'DELETE FROM "outbox" WHERE "ownerId" IS $w0',
      params: { $w0: "o1" },
    });
  });
});

describe("buildCount", () => {
  it("counts the whole table", () => {
    expect(buildCount("transactions")).toEqual({
      sql: 'SELECT COUNT(*) AS "total" FROM "transactions"',
      params: {},
    });
  });

  it("counts with a filter", () => {
    expect(buildCount("outbox", { ownerId: "o1", status: "conflict" })).toEqual({
      sql:
        'SELECT COUNT(*) AS "total" FROM "outbox"' +
        ' WHERE "ownerId" IS $w0 AND "status" IS $w1',
      params: { $w0: "o1", $w1: "conflict" },
    });
  });
});
