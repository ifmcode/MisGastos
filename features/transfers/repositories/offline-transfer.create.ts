import type { DatabasePort } from "@/shared/lib/local-db/database.port";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import { requestSyncTrigger } from "@/shared/services/sync/sync-trigger";
import { INITIAL_REVISION } from "@/shared/utils/revision";
import { readClientDocumentId } from "@/shared/utils/client-id";

import { TransferOperationError } from "../services/transfer.errors";
import type { CreateTransferDto } from "../types/transfer.types";
import { fromTransferLocalRow } from "./local-transfer.mapper";
import {
  readAffectedTransferWallets,
  readTransferPendingDeltas,
} from "./offline-transfer.balances";
import {
  buildCreatedTransferRow,
  readTransferRowById,
  requireMappedTransfer,
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

/** Creates a pending transfer and queues its outbox row. */
export async function createOfflineTransfer(
  port: DatabasePort,
  ownerId: string,
  dto: CreateTransferDto,
  deps: OfflineTransferWriteDeps,
): Promise<TransferMutationResult> {
  const result = await port.transaction(async (tx) => {
    const providedId = readClientDocumentId(dto.id);
    if (providedId) {
      const existing = await readTransferRowById(tx, providedId);
      if (existing) {
        throw new TransferOperationError("TRANSFER_INVALID");
      }
    }

    assertTransferFields(dto);

    const rows = await loadTransferWalletRows(tx, ownerId, dto);
    assertTransferCurrencies(rows, dto);

    const deltas = await readTransferPendingDeltas(port, ownerId, tx);
    assertTransferFunds(rows.from, deltas, dto);

    const now = deps.now();
    const id = providedId ?? deps.createId();
    const row = buildCreatedTransferRow(ownerId, id, dto, now);
    const transfer = requireMappedTransfer(fromTransferLocalRow(row));

    await tx.upsert("transfers", row);
    // `dependsOn` stays empty: wallets are never created offline today.
    // Phase 5 fills it when a transfer can depend on a pending wallet.
    await new LocalOutboxRepository(port).enqueue(
      {
        clientMutationId: deps.createId(),
        ownerId,
        entityType: "transfer",
        entityId: id,
        operation: "create",
        baseRevision: INITIAL_REVISION,
        localSnapshot: toTransferSnapshot(row),
        serverSnapshot: {},
        now,
      },
      tx,
    );

    const wallets = await readAffectedTransferWallets(
      port,
      ownerId,
      [dto.fromWalletId, dto.toWalletId],
      tx,
    );
    return { transfer, wallets };
  });

  requestSyncTrigger();
  return result;
}
