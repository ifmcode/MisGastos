import type { DatabasePort } from "@/shared/lib/local-db/database.port";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import { requestSyncTrigger } from "@/shared/services/sync/sync-trigger";

import { TransferOperationError } from "../services/transfer.errors";
import { fromTransferLocalRow } from "./local-transfer.mapper";
import { readAffectedTransferWallets } from "./offline-transfer.balances";
import {
  markTransferRowDeleted,
  readTransferRow,
  requireMappedTransfer,
  resolveTransferOutboxServerState,
  toTransferSnapshot,
} from "./offline-transfer.rows";
import type { OfflineTransferWriteDeps } from "./offline-transfer.write.types";
import type { TransferMutationResult } from "./transfer.repository";

/** Soft-deletes a transfer, or cancels a pending create without sending it. */
export async function deleteOfflineTransfer(
  port: DatabasePort,
  ownerId: string,
  transferId: string,
  deps: OfflineTransferWriteDeps,
): Promise<TransferMutationResult> {
  const result = await port.transaction(async (tx) => {
    const existingRow = await readTransferRow(tx, ownerId, transferId);
    if (!existingRow) {
      throw new TransferOperationError("TRANSFER_NOT_FOUND");
    }

    const previous = requireMappedTransfer(
      fromTransferLocalRow(existingRow),
    );
    if (previous.deletedAt) {
      throw new TransferOperationError("TRANSFER_NOT_FOUND");
    }

    const outbox = new LocalOutboxRepository(port);
    const mutation = await outbox.find(ownerId, "transfer", transferId, tx);
    const now = deps.now();
    const walletIds = [previous.fromWalletId, previous.toWalletId];

    if (mutation?.operation === "create") {
      await tx.delete("transfers", { id: transferId, ownerId });
      await outbox.remove(ownerId, mutation.clientMutationId, tx);

      const wallets = await readAffectedTransferWallets(
        port,
        ownerId,
        walletIds,
        tx,
      );
      return {
        transfer: { ...previous, deletedAt: now, updatedAt: now },
        wallets,
      };
    }

    const row = markTransferRowDeleted(previous, now);
    const server = resolveTransferOutboxServerState(existingRow, mutation);

    await tx.upsert("transfers", row);
    await outbox.enqueue(
      {
        clientMutationId: deps.createId(),
        ownerId,
        entityType: "transfer",
        entityId: transferId,
        operation: "delete",
        baseRevision: server.baseRevision,
        localSnapshot: toTransferSnapshot(row),
        serverSnapshot: server.serverSnapshot,
        now,
      },
      tx,
    );

    const wallets = await readAffectedTransferWallets(
      port,
      ownerId,
      walletIds,
      tx,
    );
    return {
      transfer: requireMappedTransfer(fromTransferLocalRow(row)),
      wallets,
    };
  });

  requestSyncTrigger();
  return result;
}
