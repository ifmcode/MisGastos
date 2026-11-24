import { beforeEach, describe, expect, it } from "@jest/globals";

import type { LocalRow } from "../local-db.types";
import { createSQLiteDatabasePort } from "../sqlite-port";
import { FakeConnection } from "./sqlite-port.fakes";

describe("SQLite database port statements", () => {
  let connection: FakeConnection;

  beforeEach(() => {
    connection = new FakeConnection();
  });

  it("writes rows with an ON CONFLICT upsert", async () => {
    const port = createSQLiteDatabasePort(connection);

    await port.upsert("wallets", { id: "w1", ownerId: "o1" });

    expect(connection.calls[0]).toEqual({
      sql:
        'INSERT INTO "wallets" ("id", "ownerId") VALUES ($v0, $v1)' +
        ' ON CONFLICT ("id") DO UPDATE SET "ownerId" = excluded."ownerId"',
      params: { $v0: "w1", $v1: "o1" },
    });
  });

  it("returns the affected rows of update and delete", async () => {
    const port = createSQLiteDatabasePort(connection);
    connection.runResults.push({ changes: 2 }, { changes: 1 });

    await expect(port.update("wallets", { id: "w1" }, { name: "x" })).resolves.toBe(2);
    await expect(port.delete("wallets", { id: "w1" })).resolves.toBe(1);
  });

  it("skips the update when there is nothing to change", async () => {
    const port = createSQLiteDatabasePort(connection);

    await expect(port.update("wallets", { id: "w1" }, {})).resolves.toBe(0);
    expect(connection.calls).toHaveLength(0);
  });

  it("selects rows and counts them", async () => {
    const port = createSQLiteDatabasePort(connection);
    connection.allResults.push([{ id: "w1" }], [{ id: "w9" }], [{ total: 4 }], []);

    const rows = await port.select<LocalRow>("wallets");
    const ordered = await port.select<LocalRow>("wallets", {
      orderBy: [{ column: "id", direction: "desc" }],
      limit: 1,
    });

    expect(rows).toEqual([{ id: "w1" }]);
    expect(ordered).toEqual([{ id: "w9" }]);
    await expect(port.count("wallets", { ownerId: "o1" })).resolves.toBe(4);
    await expect(port.count("wallets")).resolves.toBe(0);
    expect(connection.calls[1].sql).toContain('ORDER BY "id" DESC LIMIT $limit');
  });

  it("reads and writes PRAGMA user_version", async () => {
    const port = createSQLiteDatabasePort(connection);
    connection.allResults.push([{ user_version: 2 }], []);

    await expect(port.getSchemaVersion()).resolves.toBe(2);
    await expect(port.getSchemaVersion()).resolves.toBe(0);

    await port.setSchemaVersion(3.7);
    await port.setSchemaVersion(-1);
    expect(connection.executed).toEqual([
      "PRAGMA user_version = 3",
      "PRAGMA user_version = 0",
    ]);
  });

  it("executes DDL statements one by one and closes the connection", async () => {
    const port = createSQLiteDatabasePort(connection);

    await port.executeStatements(["CREATE TABLE a", "CREATE INDEX b"]);
    await port.close();

    expect(connection.executed).toEqual(["CREATE TABLE a", "CREATE INDEX b"]);
    expect(connection.closed).toBe(true);
  });
});
