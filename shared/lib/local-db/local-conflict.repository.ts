import type {
  DatabasePort,
  LocalDatabaseTransaction,
} from "./database.port";
import type {
  LocalConflict,
  LocalConflictInput,
  LocalConflictResolution,
  LocalRow,
} from "./local-db.types";
import { conflictFromRow } from "./conflict.mapper";
import type { IConflictRepository } from "./conflict.repository";
import {
  createLocalConflict,
  removeConflictsByOwner,
  resolveLocalConflictRow,
} from "./local-conflict.repository.writes";

const TABLE = "conflicts" as const;

export class LocalConflictRepository implements IConflictRepository {
  constructor(private readonly port: DatabasePort) {}

  async listOpen(
    ownerId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalConflict[]> {
    return this.list(ownerId, tx, { resolvedAt: null });
  }

  async listByOwner(
    ownerId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalConflict[]> {
    return this.list(ownerId, tx);
  }

  async countOpen(
    ownerId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<number> {
    return (tx ?? this.port).count(TABLE, { ownerId, resolvedAt: null });
  }

  async findByMutation(
    ownerId: string,
    clientMutationId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalConflict | null> {
    return this.find(ownerId, { clientMutationId }, tx);
  }

  async findById(
    ownerId: string,
    conflictId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalConflict | null> {
    return this.find(ownerId, { id: conflictId }, tx);
  }

  create(
    input: LocalConflictInput,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalConflict> {
    return createLocalConflict(this.port, tx, input);
  }

  resolve(
    ownerId: string,
    conflictId: string,
    resolution: LocalConflictResolution,
    now: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalConflict> {
    return resolveLocalConflictRow(
      this.port,
      tx,
      ownerId,
      conflictId,
      resolution,
      now,
    );
  }

  removeByOwner(
    ownerId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<void> {
    return removeConflictsByOwner(this.port, tx, ownerId);
  }

  private async list(
    ownerId: string,
    tx: LocalDatabaseTransaction | undefined,
    extra: Record<string, string | null> = {},
  ): Promise<LocalConflict[]> {
    const rows = await (tx ?? this.port).select<LocalRow>(TABLE, {
      where: { ownerId, ...extra },
      orderBy: [{ column: "detectedAt", direction: "asc" }],
    });

    return rows.map(conflictFromRow);
  }

  private async find(
    ownerId: string,
    filter: Record<string, string>,
    tx?: LocalDatabaseTransaction,
  ): Promise<LocalConflict | null> {
    const rows = await (tx ?? this.port).select<LocalRow>(TABLE, {
      where: { ownerId, ...filter },
      limit: 1,
    });

    return rows[0] ? conflictFromRow(rows[0]) : null;
  }
}
