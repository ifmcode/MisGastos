import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { migrateLocalDatabase } from "../database";
import { InMemoryDatabase } from "../in-memory.database";
import { LOCAL_DB_ERROR_CODES, LocalDbError } from "../local-db.errors";
import { LATEST_SCHEMA_VERSION } from "../migrations";
import { SCHEMA_V1_STATEMENTS } from "../schema";

describe("migrateLocalDatabase", () => {
  let db: InMemoryDatabase;

  beforeEach(() => {
    db = new InMemoryDatabase();
  });

  it("applies version 1 from an empty database", async () => {
    await expect(migrateLocalDatabase(db)).resolves.toBe(1);

    await expect(db.getSchemaVersion()).resolves.toBe(LATEST_SCHEMA_VERSION);
    expect(db.executedStatements).toEqual([...SCHEMA_V1_STATEMENTS]);
  });

  it("is idempotent: a second call applies nothing", async () => {
    await migrateLocalDatabase(db);
    const statementsAfterFirst = db.executedStatements.length;

    await expect(migrateLocalDatabase(db)).resolves.toBe(0);
    expect(db.executedStatements).toHaveLength(statementsAfterFirst);
  });

  it("skips migrations already applied", async () => {
    await db.setSchemaVersion(LATEST_SCHEMA_VERSION);

    await expect(migrateLocalDatabase(db)).resolves.toBe(0);
    expect(db.executedStatements).toHaveLength(0);
  });

  it("rejects a database written by a newer binary", async () => {
    await db.setSchemaVersion(LATEST_SCHEMA_VERSION + 1);

    await expect(migrateLocalDatabase(db)).rejects.toMatchObject({
      code: LOCAL_DB_ERROR_CODES.SCHEMA_NEWER,
    });
    expect(db.executedStatements).toHaveLength(0);
  });

  it("wraps a failing statement with LOCAL_DB_MIGRATION_FAILED", async () => {
    const cause = new Error("disk full");
    jest.spyOn(db, "executeStatements").mockRejectedValueOnce(cause);

    const failure = await migrateLocalDatabase(db).catch((error) => error);

    expect(failure).toBeInstanceOf(LocalDbError);
    expect((failure as LocalDbError).code).toBe(
      LOCAL_DB_ERROR_CODES.MIGRATION_FAILED,
    );
    expect((failure as LocalDbError).cause).toBe(cause);
    await expect(db.getSchemaVersion()).resolves.toBe(0);
  });

  it("keeps the previous version when the version write fails", async () => {
    jest.spyOn(db, "setSchemaVersion").mockRejectedValueOnce(new Error("nope"));

    await expect(migrateLocalDatabase(db)).rejects.toMatchObject({
      code: LOCAL_DB_ERROR_CODES.MIGRATION_FAILED,
    });
    await expect(db.getSchemaVersion()).resolves.toBe(0);
  });
});
