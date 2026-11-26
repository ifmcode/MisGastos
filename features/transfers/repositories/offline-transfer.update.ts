import type { DatabasePort } from "@/shared/lib/local-db/database.port";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import { requestSyncTrigger } from "@/shared/services/sync/sync-trigger";

import { TransferOperationError } from "../services/transfer.errors";
import type { UpdateTransferDto } from "../types/transfer.types";
import { fromTransferLocalRow } from "./local-transfer.mapper";
import {
  readAffectedTransferWallets,
  readTransferPendingDeltas,
} from "./offline-transfer.balances";
import {
  buildUpdatedTransferRow,
  readTransferRow,
  requireMappedTransfer,
  resolveTransferOutboxServerState,
  toTransferSnapshot,
} from "./offline-transfer.rows";
import {
  assertTransferCurrencies,
  assertTransferFields,
  assertTransferFunds,
  loadTransferWalletRows,
} from "./offline-transfer.validation";
import type { OfflineTransferWriteDeps } from "./offline-transfer.write.types";
import type { TransferMutationResult } from "./transfer.repository";

/** Edits a pending transfer; a missing local row is delegated by the repo. */
export async function updateOfflineTransfer(
  port: DatabasePort,
  ownerId: string,
  transferId: string,
  dto: UpdateTransferDto,
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

    assertTransferFields(dto);

    const rows = await loadTransferWalletRows(tx, ownerId, dto, previous);
    assertTransferCurrencies(rows, dto);

    const deltas = await readTransferPendingDeltas(port, ownerId, tx);
    assertTransferFunds(rows.from, deltas, dto, previous);

    const now = deps.now();
    const row = buildUpdatedTransferRow(previous, dto, now);
    const transfer = requireMappedTransfer(fromTransferLocalRow(row));
    const outbox = new LocalOutboxRepository(port);
    const mutation = await outbox.find(ownerId, "transfer", transferId, tx);
    const server = resolveTransferOutboxServerState(existingRow, mutation);

    await tx.upsert("transfers", row);
    await outbox.enqueue(
      {
        clientMutationId: deps.createId(),
        ownerId,
        entityType: "transfer",
        entityId: transferId,
        operation: "update",
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
      [
        previous.fromWalletId,
        previous.toWalletId,
        dto.fromWalletId,
        dto.toWalletId,
      ],
      tx,
    );
    return { transfer, wallets };
  });

  requestSyncTrigger();
  return result;
}
