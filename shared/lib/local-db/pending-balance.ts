import { roundMoney } from "@/shared/utils/money";

import type { OutboxMutation } from "./local-db.types";
import {
  isSnapshotRecord,
  readTransactionEffect,
  readTransferEffect,
  type TransactionEffect,
  type TransferEffect,
} from "./pending-balance.snapshots";

function addDelta(
  deltas: Map<string, number>,
  walletId: string,
  amount: number,
): void {
  deltas.set(walletId, roundMoney((deltas.get(walletId) ?? 0) + amount));
}

function applyTransactionEffect(
  deltas: Map<string, number>,
  effect: TransactionEffect | null,
  sign: 1 | -1,
): void {
  if (!effect) return;
  addDelta(deltas, effect.walletId, roundMoney(effect.signedAmount * sign));
}

function applyTransferEffect(
  deltas: Map<string, number>,
  effect: TransferEffect | null,
  sign: 1 | -1,
): void {
  if (!effect) return;

  addDelta(deltas, effect.fromWalletId, roundMoney(-effect.amount * sign));
  addDelta(deltas, effect.toWalletId, roundMoney(effect.amount * sign));
}

function applyTransactionMutation(
  deltas: Map<string, number>,
  mutation: OutboxMutation,
  localSnapshot: Record<string, unknown>,
  serverSnapshot: Record<string, unknown>,
): void {
  const local = readTransactionEffect(localSnapshot);
  const server = readTransactionEffect(serverSnapshot);

  if (mutation.operation === "create") {
    applyTransactionEffect(deltas, local, 1);
    return;
  }

  if (mutation.operation === "update") {
    applyTransactionEffect(deltas, local, 1);
    applyTransactionEffect(deltas, server, -1);
    return;
  }

  applyTransactionEffect(deltas, server ?? local, -1);
}

function applyTransferMutation(
  deltas: Map<string, number>,
  mutation: OutboxMutation,
  localSnapshot: Record<string, unknown>,
  serverSnapshot: Record<string, unknown>,
): void {
  const local = readTransferEffect(localSnapshot);
  const server = readTransferEffect(serverSnapshot);

  if (mutation.operation === "create") {
    applyTransferEffect(deltas, local, 1);
    return;
  }

  if (mutation.operation === "update") {
    applyTransferEffect(deltas, local, 1);
    applyTransferEffect(deltas, server, -1);
    return;
  }

  applyTransferEffect(deltas, server ?? local, -1);
}

/**
 * Pending wallet deltas derived from the outbox, with the same signed helpers
 * the online path uses. The result is never accumulated: callers recompute it
 * after every local write, push or pull.
 *
 * Only transaction and transfer rows contribute; wallet/category rows are
 * ignored. Malformed snapshots are skipped instead of throwing. The orphan
 * wallet id (`-1`) is returned in the map but applying it is the caller's
 * decision (it never matches an existing wallet).
 */
export function readOutboxWalletDeltas(
  mutations: readonly OutboxMutation[],
): Map<string, number> {
  const deltas = new Map<string, number>();

  for (const mutation of mutations) {
    const localSnapshot = isSnapshotRecord(mutation.localSnapshot)
      ? mutation.localSnapshot
      : {};
    const serverSnapshot = isSnapshotRecord(mutation.serverSnapshot)
      ? mutation.serverSnapshot
      : {};

    if (mutation.entityType === "transaction") {
      applyTransactionMutation(deltas, mutation, localSnapshot, serverSnapshot);
    } else if (mutation.entityType === "transfer") {
      applyTransferMutation(deltas, mutation, localSnapshot, serverSnapshot);
    }
  }

  return deltas;
}
