import { describe, expect, it, jest } from "@jest/globals";

import { InMemoryDatabase } from "../in-memory.database";
import type { LocalRow, LocalTableName } from "../local-db.types";
import { OWNER_SCOPED_LOCAL_TABLES, purgeOwnerLocalData } from "../owner-purge";
import { SCHEMA_TABLE_STATEMENTS } from "../schema.tables";

const OWNER = "owner-1";
const OTHER = "owner-2";

/** `CREATE TABLE IF NOT EXISTS <name> ( <body> )` → name + column body. */
function parseTable(statement: string): { table: string; body: string } | null {
  const match = /CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*)\)\s*$/.exec(
    statement,
  );

  if (!match) return null;

  return { table: match[1], body: match[2] };
}

/** Tables of the current schema whose DDL declares an `ownerId` column. */
function schemaOwnerTables(): string[] {
  return SCHEMA_TABLE_STATEMENTS.flatMap((statement) => {
    const parsed = parseTable(statement);
    if (!parsed) return [];

    return /^\s*ownerId\s+/m.test(parsed.body) ? [parsed.table] : [];
  });
}

function rowFor(table: LocalTableName, ownerId: string): LocalRow {
  return { id: `${table}-${ownerId}`, ownerId };
}

async function seedOwner(db: InMemoryDatabase, ownerId: string): Promise<void> {
  for (const table of OWNER_SCOPED_LOCAL_TABLES) {
    db.seed(table, [rowFor(table, ownerId)]);
  }
}

describe("purgeOwnerLocalData", () => {
  it("deletes every table of one account and keeps the other intact", async () => {
    const db = new InMemoryDatabase();
    await seedOwner(db, OWNER);
    await seedOwner(db, OTHER);

    await purgeOwnerLocalData(db, OWNER);

    for (const table of OWNER_SCOPED_LOCAL_TABLES) {
      await expect(db.count(table, { ownerId: OWNER })).resolves.toBe(0);
      await expect(db.count(table, { ownerId: OTHER })).resolves.toBe(1);
    }
  });

  it("covers all 18 owner-scoped tables", () => {
    expect(OWNER_SCOPED_LOCAL_TABLES).toHaveLength(18);
    expect(new Set(OWNER_SCOPED_LOCAL_TABLES).size).toBe(18);
  });

  it("matches exactly the tables of the schema that declare ownerId", () => {
    const fromSchema = schemaOwnerTables();

    expect(fromSchema).not.toHaveLength(0);
    expect(fromSchema.sort()).toEqual([...OWNER_SCOPED_LOCAL_TABLES].sort());
  });

  it("parses every table statement of the schema", () => {
    const parsed = SCHEMA_TABLE_STATEMENTS.map(parseTable);

    expect(parsed.filter((entry) => entry === null)).toEqual([]);
  });

  it("runs every delete inside a single transaction", async () => {
    const db = new InMemoryDatabase();
    await seedOwner(db, OWNER);
    const transaction = jest.spyOn(db, "transaction");

    await purgeOwnerLocalData(db, OWNER);

    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("is idempotent and leaves another account's cache metadata alone", async () => {
    const db = new InMemoryDatabase();
    await seedOwner(db, OWNER);
    await seedOwner(db, OTHER);

    await purgeOwnerLocalData(db, OWNER);
    await expect(purgeOwnerLocalData(db, OWNER)).resolves.toBeUndefined();

    await expect(db.count("cacheMeta", { ownerId: OTHER })).resolves.toBe(1);
    await expect(db.count("outbox", { ownerId: OTHER })).resolves.toBe(1);
  });
});
