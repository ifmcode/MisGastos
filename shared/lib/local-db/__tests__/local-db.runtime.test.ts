import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { DatabasePort } from "../database.port";
import {
  getLocalDatabase,
  openLocalDatabasePort,
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "../local-db.runtime";
import { InMemoryDatabase } from "../in-memory.database";
import { LOCAL_DB_ERROR_CODES } from "../local-db.errors";

const FLAG = "EXPO_PUBLIC_OFFLINE_FIRST";

describe("local database runtime", () => {
  let previousFlag: string | undefined;

  beforeEach(() => {
    previousFlag = process.env[FLAG];
    delete process.env[FLAG];
    resetLocalDatabasePort();
  });

  afterEach(() => {
    resetLocalDatabasePort();
    jest.restoreAllMocks();

    if (previousFlag === undefined) {
      delete process.env[FLAG];
    } else {
      process.env[FLAG] = previousFlag;
    }
  });

  it("returns the injected port even when the flag is off", async () => {
    const db = new InMemoryDatabase();
    setLocalDatabasePort(db);

    await expect(getLocalDatabase()).resolves.toBe(db);
  });

  it("returns null when no database is available", async () => {
    setLocalDatabasePort(null);

    await expect(getLocalDatabase()).resolves.toBeNull();
  });

  it("returns null when the flag is off and there is no injected port", async () => {
    resetLocalDatabasePort();

    await expect(getLocalDatabase()).resolves.toBeNull();
  });

  it("clears the injected port on reset", async () => {
    const db = new InMemoryDatabase();
    setLocalDatabasePort(db);
    resetLocalDatabasePort();

    await expect(getLocalDatabase()).resolves.toBeNull();
  });

  it("opens and migrates a database through the supplied opener", async () => {
    const db = new InMemoryDatabase();

    const port = await openLocalDatabasePort(async () => db);

    expect(port).toBe(db);
    await expect(db.getSchemaVersion()).resolves.toBe(2);
  });

  it("resolves null and logs the open failure code", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const port = await openLocalDatabasePort(async () => {
      throw new Error("no native module");
    });

    expect(port).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      `[local-db] ${LOCAL_DB_ERROR_CODES.OPEN_FAILED}`,
    );
  });

  it("closes the database and logs a migration failure", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const db = new InMemoryDatabase();
    const close = jest.spyOn(db, "close");
    jest.spyOn(db, "executeStatements").mockRejectedValueOnce(new Error("ddl"));

    const port: DatabasePort | null = await openLocalDatabasePort(async () => db);

    expect(port).toBeNull();
    expect(close).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      `[local-db] ${LOCAL_DB_ERROR_CODES.MIGRATION_FAILED}`,
    );
  });

  it("still resolves null when closing the failed port rejects", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const db = new InMemoryDatabase();
    jest.spyOn(db, "close").mockRejectedValueOnce(new Error("close failed"));
    jest.spyOn(db, "executeStatements").mockRejectedValueOnce(new Error("ddl"));

    await expect(openLocalDatabasePort(async () => db)).resolves.toBeNull();
  });
});
