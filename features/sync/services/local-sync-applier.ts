import type {
  DatabasePort,
  LocalDatabaseTransaction,
} from "@/shared/lib/local-db/database.port";
import { LocalConflictRepository } from "@/shared/lib/local-db/local-conflict.repository";
import {
  markRecordSynced,
  setRecordSyncStatus,
} from "@/shared/lib/local-db/local-record-sync";
import { applyRemoteWalletBalances } from "@/shared/lib/local-db/local-wallet-sync";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import type {
  ApplyConflictInput,
  ApplyFailureInput,
  ApplySuccessInput,
  SyncMutationApplier,
} from "@/shared/services/sync/sync.applier.types";

/**
 * Writes one push outcome back to SQLite. Every branch commits the record
 * status, the outbox row and (for a conflict) its evidence in ONE transaction,
 * so a crash can never leave the queue and the record disagreeing.
 */
export class LocalSyncApplier implements SyncMutationApplier {
  constructor(
    private readonly getPort: () => Promise<DatabasePort | null>,
  ) {}

  async applySuccess({
    ownerId,
    mutation,
    revisionAfter,
    wallets,
    now,
  }: ApplySuccessInput): Promise<void> {
    await this.withPort(async (port, tx) => {
      await markRecordSynced(
        tx,
        mutation.entityType,
        ownerId,
        mutation.entityId,
        revisionAfter,
        now,
      );
      await applyRemoteWalletBalances(tx, ownerId, wallets, now);
      await new LocalOutboxRepository(port).remove(
        ownerId,
        mutation.clientMutationId,
        tx,
      );
    });
  }

  async applyConflict({
    ownerId,
    mutation,
    kind,
    errorCode,
    remoteSnapshot,
    now,
  }: ApplyConflictInput): Promise<void> {
    await this.withPort(async (port, tx) => {
      await new LocalConflictRepository(port).create(
        {
          ownerId,
          clientMutationId: mutation.clientMutationId,
          entityType: mutation.entityType,
          entityId: mutation.entityId,
          kind,
          localSnapshot: mutation.localSnapshot,
          remoteSnapshot,
          detectedAt: now,
        },
        tx,
      );
      await new LocalOutboxRepository(port).markConflict(
        ownerId,
        mutation.clientMutationId,
        { errorCode, now },
        tx,
      );
      await setRecordSyncStatus(
        tx,
        mutation.entityType,
        ownerId,
        mutation.entityId,
        "conflict",
        now,
      );
    });
  }

  async applyFailure({
    ownerId,
    mutation,
    errorCode,
    attempts,
    nextAttemptAt,
    now,
  }: ApplyFailureInput): Promise<void> {
    await this.withPort(async (port, tx) => {
      await new LocalOutboxRepository(port).markFailed(
        ownerId,
        mutation.clientMutationId,
        { errorCode, attempts, nextAttemptAt, now },
        tx,
      );
      await setRecordSyncStatus(
        tx,
        mutation.entityType,
        ownerId,
        mutation.entityId,
        "failed",
        now,
      );
    });
  }

  private async withPort(
    work: (port: DatabasePort, tx: LocalDatabaseTransaction) => Promise<void>,
  ): Promise<void> {
    const port = await this.getPort();
    if (!port) return;

    await port.transaction((tx) => work(port, tx));
  }
}
