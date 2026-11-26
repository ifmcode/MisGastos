import type { DatabasePort } from "@/shared/lib/local-db/database.port";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import { readWalletsWithPendingBalance } from "@/features/wallets/repositories/local-wallet.balances";

import { TransactionOperationError } from "../services/transaction.errors";
import type { TransactionMutationResult } from "./transaction.repository";
import { fromTransactionLocalRow } from "./local-transaction.mapper";
import {
  markTransactionRowDeleted,
  readTransactionRow,
  resolveOutboxServerState,
  toTransactionSnapshot,
} from "./offline-transaction.snapshots";
import { requireMappedTransaction } from "./offline-transaction.validation";
import { hasStoredMovementLink } from "./transaction-stored.utils";
import type { OfflineTransactionWriteDeps } from "./offline-transaction.write.types";

/** Soft-deletes a movement, or cancels a pending create without sending it. */
export async function deleteOfflineTransaction(
  port: DatabasePort,
  ownerId: string,
  transactionId: string,
  deps: OfflineTransactionWriteDeps,
): Promise<TransactionMutationResult> {
  return port.transaction(async (tx) => {
    const existingRow = await readTransactionRow(tx, ownerId, transactionId);
    if (!existingRow) {
      throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
    }

    const existing = requireMappedTransaction(
      fromTransactionLocalRow(existingRow),
    );

    if (existing.deletedAt !== null) {
      const wallets = await readWalletsWithPendingBalance(
        port,
        ownerId,
        [existing.walletId],
        tx,
      );
      // Already deleted: return the stored stamps untouched without reading
      // the outbox or the clock again.
      return { transaction: existing, wallets };
    }

    if (hasStoredMovementLink(existingRow)) {
      throw new TransactionOperationError("TRANSACTION_INVALID");
    }

    const outbox = new LocalOutboxRepository(port);
    const mutation = await outbox.find(
      ownerId,
      "transaction",
      transactionId,
      tx,
    );
    const now = deps.now();

    if (mutation?.operation === "create") {
      await tx.delete("transactions", { id: transactionId, ownerId });
      await outbox.remove(ownerId, mutation.clientMutationId, tx);

      const wallets = await readWalletsWithPendingBalance(
        port,
        ownerId,
        [existing.walletId],
        tx,
      );
      return {
        transaction: { ...existing, deletedAt: now, updatedAt: now },
        wallets,
      };
    }

    const row = markTransactionRowDeleted(existing, now);
    const server = resolveOutboxServerState(existingRow, mutation);

    await tx.upsert("transactions", row);
    await outbox.enqueue(
      {
        clientMutationId: deps.createId(),
        ownerId,
        entityType: "transaction",
        entityId: transactionId,
        operation: "delete",
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
      [existing.walletId],
      tx,
    );
    return {
      transaction: requireMappedTransaction(fromTransactionLocalRow(row)),
      wallets,
    };
  });
}
