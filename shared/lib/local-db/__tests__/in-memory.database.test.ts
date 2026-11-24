import { describe, expect, it } from "@jest/globals";

import { InMemoryDatabase } from "../in-memory.database";
import { LOCAL_DB_ERROR_CODES } from "../local-db.errors";
import { buildRow } from "./db.fixtures";

describe("InMemoryDatabase writes", () => {
  it("upserts by primary key and keeps other rows", async () => {
    const db = new InMemoryDatabase();
    await db.upsert("wallets", buildRow({ id: "w1", name: "Cash" }));
    await db.upsert("wallets", buildRow({ id: "w2", name: "Bank" }));
    await db.upsert("wallets", buildRow({ id: "w1", name: "Pocket" }));

    const rows = await db.select("wallets", { orderBy: [{ column: "id" }] });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: "w1", name: "Pocket" });
  });

  it("rejects a second row with the same outbox unique key", async () => {
    const db = new InMemoryDatabase();
    const row = {
      clientMutationId: "m1",
      ownerId: "owner-1",
      entityType: "transaction",
      entityId: "tx-1",
    };

    await db.upsert("outbox", row);

    await expect(
      db.upsert("outbox", { ...row, clientMutationId: "m2" }),
    ).rejects.toMatchObject({
      code: LOCAL_DB_ERROR_CODES.UNIQUE_VIOLATION,
    });
    await expect(db.count("outbox")).resolves.toBe(1);
  });

  it("treats a missing unique key column as null", async () => {
    const db = new InMemoryDatabase();
    const row = {
      clientMutationId: "m1",
      ownerId: "owner-1",
      entityType: "transaction",
    };

    await db.upsert("outbox", row);

    await expect(
      db.upsert("outbox", { ...row, clientMutationId: "m2" }),
    ).rejects.toMatchObject({
      code: LOCAL_DB_ERROR_CODES.UNIQUE_VIOLATION,
    });
  });

  it("updates matching rows and reports the affected count", async () => {
    const db = new InMemoryDatabase();
    db.seed("wallets", [
      buildRow({ id: "w1" }),
      buildRow({ id: "w2" }),
      buildRow({ id: "w3" }),
    ]);

    await expect(db.update("wallets", { ownerId: "owner-1" }, { name: "x" }))
      .resolves.toBe(3);
    await expect(db.update("wallets", { id: "w2" }, { name: "y" })).resolves.toBe(1);
    await expect(db.update("wallets", { id: "missing" }, { name: "x" }))
      .resolves.toBe(0);

    const updated = await db.select("wallets", { where: { name: "x" } });
    expect(updated).toHaveLength(2);
    await expect(db.count("wallets", { name: "y" })).resolves.toBe(1);
  });

  it("deletes matching rows and reports the removed count", async () => {
    const db = new InMemoryDatabase();
    db.seed("wallets", [buildRow({ id: "w1" }), buildRow({ id: "w2" })]);

    await expect(db.delete("wallets", { id: "w1" })).resolves.toBe(1);
    await expect(db.delete("wallets", { id: "w1" })).resolves.toBe(0);
    await expect(db.count("wallets")).resolves.toBe(1);
  });

  it("rolls back every table and the schema version when the work throws", async () => {
    const db = new InMemoryDatabase();
    db.seed("wallets", [buildRow({ id: "w1" })]);

    await expect(
      db.transaction(async (tx) => {
        await tx.upsert("wallets", buildRow({ id: "w2" }));
        await tx.delete("wallets", { id: "w1" });
        await tx.setSchemaVersion(9);
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    await expect(db.count("wallets")).resolves.toBe(1);
    await expect(db.getSchemaVersion()).resolves.toBe(0);
  });

  it("rejects a transaction opened while another one is active", async () => {
    const db = new InMemoryDatabase();

    await expect(
      db.transaction(async () => {
        await db.transaction(async () => undefined);
      }),
    ).rejects.toMatchObject({
      code: LOCAL_DB_ERROR_CODES.NESTED_TRANSACTION,
    });

    // The guard is reset, so the adapter is usable again.
    await expect(db.transaction(async (tx) => {
      await tx.upsert("wallets", buildRow({ id: "w1" }));
      return "ok";
    })).resolves.toBe("ok");
    await expect(db.count("wallets")).resolves.toBe(1);
  });

  it("commits the work result and changes", async () => {
    const db = new InMemoryDatabase();

    const result = await db.transaction(async (tx) => {
      await tx.upsert("wallets", buildRow({ id: "w1" }));
      return "done";
    });

    expect(result).toBe("done");
    await expect(db.count("wallets")).resolves.toBe(1);
  });

  it("keeps the schema version and records executed statements", async () => {
    const db = new InMemoryDatabase();

    await expect(db.getSchemaVersion()).resolves.toBe(0);
    await db.setSchemaVersion(3);
    await expect(db.getSchemaVersion()).resolves.toBe(3);

    await db.executeStatements(["CREATE TABLE a", "CREATE INDEX b"]);
    expect(db.executedStatements).toEqual(["CREATE TABLE a", "CREATE INDEX b"]);
    await expect(db.close()).resolves.toBeUndefined();
  });
});
