import type {
  DatabasePort,
  LocalDatabaseTransaction,
} from "./database.port";
import type {
  OutboxEntityType,
  OutboxMutation,
  OutboxMutationInput,
  LocalRow,
} from "./local-db.types";
import { outboxMutationFromRow } from "./outbox.mapper";
import { selectNextOutboxMutation } from "./outbox.ordering";
import type {
  IOutboxRepository,
  MarkOutboxConflictInput,
  MarkOutboxFailedInput,
  RebaseOutboxInput,
} from "./outbox.repository";
import {
  findOutboxMutationForEntity,
  listOutboxRowsByOwner,
  OUTBOX_TABLE,
} from "./outbox.repository.helpers";
import {
  enqueueOutboxMutation,
  rebaseOutboxMutation,
  reclaimInterruptedOutboxMutations,
  removeOutboxMutation,
  requeueFailedOutboxMutations,
  transitionOutboxMutation,
} from "./outbox.repository.writes";
import { isPendingOutboxStatus } from "./outbox-state";

/**
 * Outbox over a `DatabasePort`. One row per `(ownerId, entityType, entityId)`
 * thanks to coalescing, ordered by a monotonic `seq` per account. Each write
 * joins the caller's transaction when one is passed (see `IOutboxRepository`).
 */
export class LocalOutboxRepository implements IOutboxRepository {
  constructor(private readonly port: DatabasePort) {}

  async enqueue(
    input: OutboxMutationInput,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation> {
    return enqueueOutboxMutation(this.port, tx, input);
  }

  async listByOwner(
    ownerId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation[]> {
    return listOutboxRowsByOwner(tx ?? this.port, ownerId);
  }

  async find(
    ownerId: string,
    entityType: OutboxEntityType,
    entityId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation | null> {
    return findOutboxMutationForEntity(
      tx ?? this.port,
      ownerId,
      entityType,
      entityId,
    );
  }

  async findById(
    ownerId: string,
    clientMutationId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation | null> {
    const rows = await (tx ?? this.port).select<LocalRow>(OUTBOX_TABLE, {
      where: { ownerId, clientMutationId },
      limit: 1,
    });

    return rows[0] ? outboxMutationFromRow(rows[0]) : null;
  }

  async listPending(ownerId: string): Promise<OutboxMutation[]> {
    const mutations = await this.listByOwner(ownerId);

    return mutations.filter((mutation) =>
      isPendingOutboxStatus(mutation.status),
    );
  }

  async countPending(ownerId: string): Promise<number> {
    const [pending, failed] = await Promise.all([
      this.port.count(OUTBOX_TABLE, { ownerId, status: "pending" }),
      this.port.count(OUTBOX_TABLE, { ownerId, status: "failed" }),
    ]);

    return pending + failed;
  }

  async countConflicts(ownerId: string): Promise<number> {
    return this.port.count(OUTBOX_TABLE, { ownerId, status: "conflict" });
  }

  async markSyncing(
    ownerId: string,
    clientMutationId: string,
    now: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation> {
    return transitionOutboxMutation(this.port, tx, ownerId, clientMutationId, (current) => ({
      ...current,
      status: "syncing",
      // Counting the send, not only the failure, is what lets a coalesced edit
      // know the previous payload may already exist on the server.
      attempts: current.attempts + 1,
      updatedAt: now,
    }));
  }

  async markFailed(
    ownerId: string,
    clientMutationId: string,
    input: MarkOutboxFailedInput,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation> {
    return transitionOutboxMutation(this.port, tx, ownerId, clientMutationId, (current) => ({
      ...current,
      status: "failed",
      attempts: input.attempts,
      nextAttemptAt: input.nextAttemptAt,
      lastErrorCode: input.errorCode,
      updatedAt: input.now,
    }));
  }

  async markConflict(
    ownerId: string,
    clientMutationId: string,
    input: MarkOutboxConflictInput,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation> {
    return transitionOutboxMutation(this.port, tx, ownerId, clientMutationId, (current) => ({
      ...current,
      status: "conflict",
      lastErrorCode: input.errorCode,
      updatedAt: input.now,
    }));
  }

  async remove(
    ownerId: string,
    clientMutationId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<void> {
    return removeOutboxMutation(this.port, tx, ownerId, clientMutationId);
  }

  async rebase(
    ownerId: string,
    clientMutationId: string,
    input: RebaseOutboxInput,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation> {
    return rebaseOutboxMutation(
      this.port,
      tx,
      ownerId,
      clientMutationId,
      input,
    );
  }

  async reclaimInterrupted(
    ownerId: string,
    now: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation[]> {
    return reclaimInterruptedOutboxMutations(this.port, tx, ownerId, now);
  }

  async requeueFailed(
    ownerId: string,
    now: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation[]> {
    return requeueFailedOutboxMutations(this.port, tx, ownerId, now);
  }

  async getNext(
    ownerId: string,
    now: string,
  ): Promise<OutboxMutation | null> {
    return selectNextOutboxMutation(await this.listByOwner(ownerId), now);
  }
}
