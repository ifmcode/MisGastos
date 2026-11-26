import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { InMemoryDatabase } from "../in-memory.database";
import {
  createSerializedDatabasePort,
  resetLocalDbLock,
} from "../serialized.database";

beforeEach(resetLocalDbLock);

describe("createSerializedDatabasePort", () => {
  it("delegates reads and writes to the wrapped port", async () => {
    const db = new InMemoryDatabase();
    const port = createSerializedDatabasePort(db);

    await port.upsert("wallets", { id: "w1", ownerId: "owner-1" });
    await expect(port.count("wallets", { ownerId: "owner-1" })).resolves.toBe(1);
    await expect(
      port.select("wallets", { where: { id: "w1" } }),
    ).resolves.toEqual([{ id: "w1", ownerId: "owner-1" }]);
    await expect(port.getSchemaVersion()).resolves.toBe(0);
  });

  it("queues transactions so they never overlap", async () => {
    const db = new InMemoryDatabase();
    const port = createSerializedDatabasePort(db);
    const log: string[] = [];
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const first = port.transaction(async () => {
      await gate;
      log.push("first");
    });
    const second = port.transaction(async () => {
      log.push("second");
    });

    await Promise.resolve();
    expect(log).toEqual([]);

    release();
    await Promise.all([first, second]);

    expect(log).toEqual(["first", "second"]);
  });

  it("rolls back the wrapped transaction like the plain port", async () => {
    const db = new InMemoryDatabase();
    const port = createSerializedDatabasePort(db);

    await expect(
      port.transaction(async (tx) => {
        await tx.upsert("wallets", { id: "w1", ownerId: "owner-1" });
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    await expect(port.count("wallets")).resolves.toBe(0);
  });

  it("closes the wrapped port", async () => {
    const db = new InMemoryDatabase();
    const spy = jest.spyOn(db, "close");
    const port = createSerializedDatabasePort(db);

    await port.close();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
