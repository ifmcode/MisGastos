import { beforeEach, describe, expect, it } from "@jest/globals";

import { LOCAL_DB_ERROR_CODES } from "../local-db.errors";
import { createSQLiteDatabasePort } from "../sqlite-port";
import { FakeConnection } from "./sqlite-port.fakes";

describe("SQLite database port transactions", () => {
  let connection: FakeConnection;

  beforeEach(() => {
    connection = new FakeConnection();
  });

  it("runs every statement on the exclusive transaction handle", async () => {
    const port = createSQLiteDatabasePort(connection);

    const result = await port.transaction(async (tx) => {
      await tx.upsert("wallets", { id: "w1" });
      await tx.update("wallets", { id: "w1" }, { name: "x" });
      await tx.delete("wallets", { id: "w1" });
      await tx.select("wallets");
      await tx.executeStatements(["CREATE TABLE a"]);
      await tx.setSchemaVersion(3);

      return tx.count("wallets");
    });

    expect(result).toBe(0);
    expect(connection.transactions).toBe(1);
    expect(connection.calls).toHaveLength(0);
    expect(connection.transactionHandle.calls).toHaveLength(5);
    expect(connection.transactionHandle.executed).toEqual([
      "CREATE TABLE a",
      "PRAGMA user_version = 3",
    ]);
  });

  it("propagates a transaction failure and resets the guard", async () => {
    const port = createSQLiteDatabasePort(connection);

    await expect(
      port.transaction(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    await expect(port.transaction(async () => "ok")).resolves.toBe("ok");
  });

  it("rejects a nested transaction instead of interleaving it", async () => {
    const port = createSQLiteDatabasePort(connection);

    await expect(
      port.transaction(async () => {
        await port.transaction(async () => undefined);
      }),
    ).rejects.toMatchObject({
      code: LOCAL_DB_ERROR_CODES.NESTED_TRANSACTION,
    });
    await expect(port.transaction(async () => "ok")).resolves.toBe("ok");
  });
});
