import type {
  DatabasePort,
  LocalDatabaseTransaction,
} from "@/shared/lib/local-db/database.port";
import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import {
  readPendingWalletDeltas,
  readWalletsWithPendingBalance,
} from "@/features/wallets/repositories/local-wallet.balances";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { roundMoney } from "@/shared/utils/money";

import type { Transfer } from "../types/transfer.types";

const WALLETS = "wallets" as const;

/** Server balance stored in a wallet row (never a derived value). */
export function readWalletRowBalance(row: LocalRow): number {
  const value = row.serverBalance;
  return typeof value === "number" && Number.isFinite(value)
    ? roundMoney(value)
    : 0;
}

/** `serverBalance + pending outbox delta` for one wallet row. */
export function derivedWalletBalance(
  row: LocalRow,
  deltas: ReadonlyMap<string, number>,
): number {
  const id = typeof row.id === "string" ? row.id : "";
  return roundMoney(readWalletRowBalance(row) + (deltas.get(id) ?? 0));
}

/**
 * Adds back the stored transfer effect when the source wallet participated in
 * it, matching the online update validation before applying the new amount.
 */
export function addBackPreviousTransfer(
  balance: number,
  previous: Transfer,
  walletId: string,
): number {
  let available = balance;

  if (previous.fromWalletId === walletId) {
    available = roundMoney(available + previous.amount);
  }
  if (previous.toWalletId === walletId) {
    available = roundMoney(available - previous.amount);
  }

  return available;
}

export async function readTransferPendingDeltas(
  port: DatabasePort,
  ownerId: string,
  tx?: LocalDatabaseTransaction,
): Promise<Map<string, number>> {
  return readPendingWalletDeltas(port, ownerId, tx);
}

/** One wallet row by id, without owner validation (the caller throws codes). */
export async function readTransferWalletRow(
  active: LocalDatabaseTransaction,
  walletId: string,
): Promise<LocalRow | null> {
  const rows = await active.select<LocalRow>(WALLETS, {
    where: { id: walletId },
    limit: 1,
  });

  return rows[0] ?? null;
}

/** Wallets touched by a transfer, with the pending delta already applied. */
export async function readAffectedTransferWallets(
  port: DatabasePort,
  ownerId: string,
  walletIds: readonly string[],
  tx?: LocalDatabaseTransaction,
): Promise<Wallet[]> {
  return readWalletsWithPendingBalance(port, ownerId, walletIds, tx);
}
