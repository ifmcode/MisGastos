import type { DatabasePort } from "@/shared/lib/local-db/database.port";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import { requestSyncTrigger } from "@/shared/services/sync/sync-trigger";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";
import { readWalletsWithPendingBalance } from "@/features/wallets/repositories/local-wallet.balances";

import { TransactionOperationError } from "../services/transaction.errors";
import type { UpdateTransactionDto } from "../types/transaction.types";
import type { TransactionMutationResult } from "./transaction.repository";
import { fromTransactionLocalRow } from "./local-transaction.mapper";
import {
  buildUpdatedTransactionRow,
  readTransactionRow,
  resolveOutboxServerState,
  toTransactionSnapshot,
} from "./offline-transaction.snapshots";
import {
  assertPreviousTransactionWallet,
  requireMappedTransaction,
  validateTransactionWallet,
} from "./offline-transaction.validation";
import type { OfflineTransactionWriteDeps } from "./offline-transaction.write.types";

/** Edits a pending movement; a missing local row is delegated by the repo. */
export async function updateOfflineTransaction(
  port: DatabasePort,
  ownerId: string,
  transactionId: string,
  dto: UpdateTransactionDto,
  deps: OfflineTransactionWriteDeps,
): Promise<TransactionMutationResult> {
  const result = await port.transaction(async (tx) => {
    const existingRow = await readTransactionRow(tx, ownerId, transactionId);
    if (!existingRow) {
      throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
    }

    const existing = requireMappedTransaction(
      fromTransactionLocalRow(existingRow),
    );
    if (existing.deletedAt !== null) {
      throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
    }

    // Editing a movement whose wallet was permanently deleted keeps the
    // orphan id; the online path skips the wallet read in that case, so the
    // concept/amount stay editable without a wallet row.
    const keepsOrphanWallet =
      isOrphanedWalletId(existing.walletId) &&
      isOrphanedWalletId(dto.walletId);

    if (!keepsOrphanWallet) {
      await validateTransactionWallet(tx, ownerId, dto.walletId, dto.currency);
    }
    await assertPreviousTransactionWallet(
      tx,
      ownerId,
      existing.walletId,
      dto.walletId,
    );

    const now = deps.now();
    const row = buildUpdatedTransactionRow(existing, dto, now);
    const transaction = requireMappedTransaction(
      fromTransactionLocalRow(row),
    );
    const outbox = new LocalOutboxRepository(port);
    const mutation = await outbox.find(
      ownerId,
      "transaction",
      transactionId,
      tx,
    );
    const server = resolveOutboxServerState(existingRow, mutation);

    await tx.upsert("transactions", row);
    await outbox.enqueue(
      {
        clientMutationId: deps.createId(),
        ownerId,
        entityType: "transaction",
        entityId: transactionId,
        operation: "update",
        baseRevision: server.baseRevision,
        localSnapshot: toTransactionSnapshot(row),
        serverSnapshot: server.serverSnapshot,
        now,
      },
      tx,
    );

    const wallets = await readWalletsWithPendingBalance(
      port,
      ownerId,
      [existing.walletId, dto.walletId],
      tx,
    );
    return { transaction, wallets };
  });

  requestSyncTrigger();
  return result;
}
