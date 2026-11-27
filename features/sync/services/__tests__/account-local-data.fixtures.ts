import type { DatabasePort } from "@/shared/lib/local-db/database.port";
import type { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";

export const OWNER = "owner-1";
export const OTHER = "owner-2";

/** One row per account in two different table shapes. */
export function seedRows(db: InMemoryDatabase): void {
  db.seed("wallets", [
    { id: "wallet-1", ownerId: OWNER },
    { id: "wallet-2", ownerId: OTHER },
  ]);
  db.seed("outboxSeq", [
    { ownerId: OWNER, nextSeq: 3 },
    { ownerId: OTHER, nextSeq: 1 },
  ]);
}

/** Port whose transaction fails, to exercise the error paths. */
export function createFailingPort(db: InMemoryDatabase): DatabasePort {
  return {
    upsert: (table, row) => db.upsert(table, row),
    update: (table, where, changes) => db.update(table, where, changes),
    delete: (table, where) => db.delete(table, where),
    select: (table, options) => db.select(table, options),
    count: (table, where) => db.count(table, where),
    transaction: async () => {
      throw new Error("boom");
    },
    executeStatements: (statements) => db.executeStatements(statements),
    setSchemaVersion: (version) => db.setSchemaVersion(version),
    getSchemaVersion: () => db.getSchemaVersion(),
    close: () => db.close(),
  };
}
