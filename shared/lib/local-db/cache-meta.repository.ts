import type {
  DatabasePort,
  LocalDatabaseTransaction,
} from "./database.port";
import type {
  LocalCacheCollection,
  LocalRow,
} from "./local-db.types";
import { runInLocalTransaction } from "./local-transaction";

const TABLE = "cacheMeta" as const;

export interface ICacheMetaRepository {
  /** Last successful fetch for this owner and collection, or null when never. */
  getFetchedAt(
    ownerId: string,
    collection: LocalCacheCollection,
  ): Promise<string | null>;
  /**
   * Stamps a successful fetch. Pass `tx` to join the caller's transaction, omit
   * it to own one.
   */
  markFetched(
    ownerId: string,
    collection: LocalCacheCollection,
    fetchedAt: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<void>;
}

function toRow(
  ownerId: string,
  collection: LocalCacheCollection,
  fetchedAt: string,
): LocalRow {
  return { ownerId, collection, fetchedAt };
}

export class LocalCacheMetaRepository implements ICacheMetaRepository {
  constructor(private readonly port: DatabasePort) {}

  async getFetchedAt(
    ownerId: string,
    collection: LocalCacheCollection,
  ): Promise<string | null> {
    const rows = await this.port.select<LocalRow>(TABLE, {
      where: { ownerId, collection },
      limit: 1,
    });
    const fetchedAt = rows[0]?.fetchedAt;

    return typeof fetchedAt === "string" ? fetchedAt : null;
  }

  async markFetched(
    ownerId: string,
    collection: LocalCacheCollection,
    fetchedAt: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<void> {
    await runInLocalTransaction(this.port, tx, async (active) => {
      await active.upsert(TABLE, toRow(ownerId, collection, fetchedAt));
    });
  }
}
