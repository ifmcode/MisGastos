import type {
  DatabasePort,
  LocalDatabaseTransaction,
} from "./database.port";
import { runInLocalTransaction } from "./local-transaction";
import type {
  LocalColumnValue,
  LocalRow,
  LocalSyncState,
} from "./local-db.types";

const TABLE = "syncState" as const;

/** Fields a sync cycle may update; omitted fields keep their stored value. */
export type LocalSyncStatePatch = Partial<Omit<LocalSyncState, "ownerId">>;

export interface ISyncStateRepository {
  /** Stored record or all-null defaults (never rejects for a missing row). */
  get(ownerId: string): Promise<LocalSyncState>;
  /**
   * Upserts the merged record; `undefined` values are never written. Pass `tx`
   * to join the caller's transaction, omit it to own one.
   */
  save(
    ownerId: string,
    patch: LocalSyncStatePatch,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalSyncState>;
}

const EMPTY_STATE: Omit<LocalSyncState, "ownerId"> = {
  lastPullAt: null,
  lastPushAt: null,
  lastFullSyncAt: null,
  lastErrorCode: null,
};

function readNullable(value: LocalColumnValue | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function pick(
  value: string | null | undefined,
  fallback: string | null,
): string | null {
  return value === undefined ? fallback : value;
}

function toRow(state: LocalSyncState): LocalRow {
  return {
    ownerId: state.ownerId,
    lastPullAt: state.lastPullAt,
    lastPushAt: state.lastPushAt,
    lastFullSyncAt: state.lastFullSyncAt,
    lastErrorCode: state.lastErrorCode,
  };
}

function fromRow(row: LocalRow, ownerId: string): LocalSyncState {
  return {
    ownerId,
    lastPullAt: readNullable(row.lastPullAt),
    lastPushAt: readNullable(row.lastPushAt),
    lastFullSyncAt: readNullable(row.lastFullSyncAt),
    lastErrorCode: readNullable(row.lastErrorCode),
  };
}

function mergeState(
  current: LocalSyncState,
  patch: LocalSyncStatePatch,
): LocalSyncState {
  return {
    ownerId: current.ownerId,
    lastPullAt: pick(patch.lastPullAt, current.lastPullAt),
    lastPushAt: pick(patch.lastPushAt, current.lastPushAt),
    lastFullSyncAt: pick(patch.lastFullSyncAt, current.lastFullSyncAt),
    lastErrorCode: pick(patch.lastErrorCode, current.lastErrorCode),
  };
}

export class LocalSyncStateRepository implements ISyncStateRepository {
  constructor(private readonly port: DatabasePort) {}

  async get(ownerId: string): Promise<LocalSyncState> {
    const rows = await this.port.select<LocalRow>(TABLE, {
      where: { ownerId },
      limit: 1,
    });
    const row = rows[0];

    return row ? fromRow(row, ownerId) : { ownerId, ...EMPTY_STATE };
  }

  async save(
    ownerId: string,
    patch: LocalSyncStatePatch,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalSyncState> {
    return runInLocalTransaction(this.port, tx, async (active) => {
      const rows = await active.select<LocalRow>(TABLE, {
        where: { ownerId },
        limit: 1,
      });
      const current = rows[0]
        ? fromRow(rows[0], ownerId)
        : { ownerId, ...EMPTY_STATE };
      const merged = mergeState(current, patch);

      await active.upsert(TABLE, toRow(merged));

      return merged;
    });
  }
}
