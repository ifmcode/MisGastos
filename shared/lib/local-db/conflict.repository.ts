import type { LocalDatabaseTransaction } from "./database.port";
import type {
  LocalConflict,
  LocalConflictInput,
  LocalConflictResolution,
} from "./local-db.types";

/**
 * Evidence of every mutation the engine stopped (ADR §7). Conflicts are never
 * auto-dismissed: `resolve` records the user's decision and keeps the row for
 * audit, while `listOpen`/`countOpen` only see unresolved ones.
 */
export interface IConflictRepository {
  /** Unresolved conflicts of the account, oldest detection first. */
  listOpen(
    ownerId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalConflict[]>;
  /** Every conflict of the account, resolved ones included. */
  listByOwner(
    ownerId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalConflict[]>;
  countOpen(ownerId: string, tx?: LocalDatabaseTransaction): Promise<number>;
  /** Conflict opened for one mutation, if any. */
  findByMutation(
    ownerId: string,
    clientMutationId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalConflict | null>;
  findById(
    ownerId: string,
    conflictId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalConflict | null>;
  /** Inserts the conflict or refreshes the open one of the same mutation. */
  create(
    input: LocalConflictInput,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalConflict>;
  /** Stamps the explicit user decision. */
  resolve(
    ownerId: string,
    conflictId: string,
    resolution: LocalConflictResolution,
    now: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalConflict>;
  /** Removes that account's conflicts (account purge). */
  removeByOwner(
    ownerId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<void>;
}
