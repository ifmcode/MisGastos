import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { migrateLocalDatabase } from "../database";
import { InMemoryDatabase } from "../in-memory.database";
import { LOCAL_DB_ERROR_CODES, LocalDbError } from "../local-db.errors";
import {
  LATEST_SCHEMA_VERSION,
  LOCAL_DB_MIGRATIONS,
} from "../migrations";
import { MIGRATION_002 } from "../migrations/migration-002";
import { buildRow } from "./db.fixtures";

describe("migrateLocalDatabase", () => {
  let db: InMemoryDatabase;

  beforeEach(() => {
    db = new InMemoryDatabase();
  });

  it("applies every migration from an empty database", async () => {
    await expect(migrateLocalDatabase(db)).resolves.toBe(
      LOCAL_DB_MIGRATIONS.length,
    );

    await expect(db.getSchemaVersion()).resolves.toBe(LATEST_SCHEMA_VERSION);
    expect(db.executedStatements).toEqual(
      LOCAL_DB_MIGRATIONS.flatMap((migration) => [...migration.statements]),
    );
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

  it("upgrades version 1 to version 2 without losing rows", async () => {
    await db.setSchemaVersion(1);
    db.seed("wallets", [
      buildRow({ id: "wallet-1", ownerId: "owner-1", name: "Cash" }),
    ]);

    await expect(migrateLocalDatabase(db)).resolves.toBe(1);

    await expect(db.getSchemaVersion()).resolves.toBe(2);
    await expect(
      db.select("wallets", { where: { id: "wallet-1" } }),
    ).resolves.toHaveLength(1);
    expect(db.executedStatements).toEqual([...MIGRATION_002.statements]);
  });

  it("adds the read-cache columns and metadata table in version 2", () => {
    const statements = MIGRATION_002.statements.join("\n");

    expect(statements).toContain(
      "ALTER TABLE transactions ADD COLUMN sharedExpenseId TEXT",
    );
    expect(statements).toContain(
      "ALTER TABLE transactions ADD COLUMN groupSettlementId TEXT",
    );
    expect(statements).toContain(
      "ALTER TABLE transfers ADD COLUMN fromWalletName TEXT",
    );
    expect(statements).toContain(
      "ALTER TABLE transfers ADD COLUMN toWalletName TEXT",
    );
    expect(statements).toContain(
      "CREATE TABLE IF NOT EXISTS cacheMeta",
    );
    expect(statements).toContain("CREATE TABLE categories_v2");
    expect(statements).toContain("INSERT INTO categories_v2");
    expect(statements).toContain("ALTER TABLE categories_v2 RENAME TO categories");
    expect(statements).not.toContain("sortOrder INTEGER NOT NULL");
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
