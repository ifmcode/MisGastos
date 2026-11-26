import type { DatabasePort } from "@/shared/lib/local-db/database.port";
import { requestSyncTrigger } from "@/shared/services/sync/sync-trigger";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import { INITIAL_REVISION } from "@/shared/utils/revision";
import { readClientDocumentId } from "@/shared/utils/client-id";
import { readWalletsWithPendingBalance } from "@/features/wallets/repositories/local-wallet.balances";

import { TransactionOperationError } from "../services/transaction.errors";
import type { CreateTransactionDto } from "../types/transaction.types";
import type { TransactionMutationResult } from "./transaction.repository";
import { fromTransactionLocalRow } from "./local-transaction.mapper";
import {
  buildCreatedTransactionRow,
  readTransactionRowById,
  toTransactionSnapshot,
} from "./offline-transaction.snapshots";
import {
  requireMappedTransaction,
  validateTransactionWallet,
} from "./offline-transaction.validation";
import type { OfflineTransactionWriteDeps } from "./offline-transaction.write.types";

/** Creates a pending movement and queues its outbox row in one transaction. */
export async function createOfflineTransaction(
  port: DatabasePort,
  ownerId: string,
  dto: CreateTransactionDto,
  deps: OfflineTransactionWriteDeps,
): Promise<TransactionMutationResult> {
  const result = await port.transaction(async (tx) => {
    const providedId = readClientDocumentId(dto.id);
    if (providedId) {
      const existing = await readTransactionRowById(tx, providedId);
      if (existing) {
        throw new TransactionOperationError("TRANSACTION_INVALID");
      }
    }

    await validateTransactionWallet(tx, ownerId, dto.walletId, dto.currency);

    const now = deps.now();
    const id = providedId ?? deps.createId();
    const row = buildCreatedTransactionRow(ownerId, id, dto, now);
    const transaction = requireMappedTransaction(
      fromTransactionLocalRow(row),
    );

    await tx.upsert("transactions", row);
    // `dependsOn` stays empty: wallets are never created offline today.
    // Phase 5 fills it when a movement can depend on a pending wallet.
    await new LocalOutboxRepository(port).enqueue(
      {
        clientMutationId: deps.createId(),
        ownerId,
        entityType: "transaction",
        entityId: id,
        operation: "create",
        baseRevision: INITIAL_REVISION,
        localSnapshot: toTransactionSnapshot(row),
        serverSnapshot: {},
        now,
      },
      tx,
    );

    const wallets = await readWalletsWithPendingBalance(
      port,
      ownerId,
      [dto.walletId],
      tx,
    );
    return { transaction, wallets };
  });

  requestSyncTrigger();
  return result;
}
