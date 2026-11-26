import type { LocalDatabaseTransaction } from "@/shared/lib/local-db/database.port";
import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";

import { TransferOperationError } from "../services/transfer.errors";
import type { CreateTransferDto, Transfer } from "../types/transfer.types";
import { hasSufficientBalance } from "../utils/transfer-balance";
import {
  addBackPreviousTransfer,
  derivedWalletBalance,
  readTransferWalletRow,
} from "./offline-transfer.balances";

export interface TransferWalletRows {
  byId: Map<string, LocalRow>;
  from: LocalRow;
  to: LocalRow;
}

/** Self-transfer and non-positive or non-finite amounts are invalid. */
export function assertTransferFields(dto: CreateTransferDto): void {
  if (dto.fromWalletId === dto.toWalletId) {
    throw new TransferOperationError("SAME_WALLET");
  }
  if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
    throw new TransferOperationError("TRANSFER_INVALID");
  }
}

function missingWalletError(
  walletId: string,
  dto: CreateTransferDto,
  previous: Transfer | null,
): TransferOperationError {
  if (walletId === dto.fromWalletId) {
    return new TransferOperationError("FROM_WALLET_NOT_FOUND");
  }
  if (walletId === dto.toWalletId) {
    return new TransferOperationError("TO_WALLET_NOT_FOUND");
  }
  if (previous && walletId === previous.fromWalletId) {
    return new TransferOperationError("FROM_WALLET_NOT_FOUND");
  }

  return new TransferOperationError("TO_WALLET_NOT_FOUND");
}

/**
 * Loads every wallet the write touches (previous and next sides), skipping
 * orphaned ids, and validates ownership like the online operation.
 */
export async function loadTransferWalletRows(
  active: LocalDatabaseTransaction,
  ownerId: string,
  dto: CreateTransferDto,
  previous: Transfer | null = null,
): Promise<TransferWalletRows> {
  const ids = new Set([dto.fromWalletId, dto.toWalletId]);
  if (previous) {
    ids.add(previous.fromWalletId);
    ids.add(previous.toWalletId);
  }

  const byId = new Map<string, LocalRow>();

  for (const walletId of ids) {
    if (isOrphanedWalletId(walletId)) continue;

    const row = await readTransferWalletRow(active, walletId);
    if (!row) throw missingWalletError(walletId, dto, previous);
    if (row.ownerId !== ownerId) {
      throw new TransferOperationError("WALLET_NOT_OWNED");
    }

    byId.set(walletId, row);
  }

  const from = byId.get(dto.fromWalletId);
  const to = byId.get(dto.toWalletId);

  if (!from) throw new TransferOperationError("FROM_WALLET_NOT_FOUND");
  if (!to) throw new TransferOperationError("TO_WALLET_NOT_FOUND");

  return { byId, from, to };
}

/** Both next wallets must use the requested currency. */
export function assertTransferCurrencies(
  rows: TransferWalletRows,
  dto: CreateTransferDto,
): void {
  if (
    rows.from.currency !== dto.currency ||
    rows.to.currency !== dto.currency
  ) {
    throw new TransferOperationError("CURRENCY_MISMATCH");
  }
}

/** Sufficient derived balance, adding back an edited transfer's own effect. */
export function assertTransferFunds(
  fromRow: LocalRow,
  deltas: ReadonlyMap<string, number>,
  dto: CreateTransferDto,
  previous: Transfer | null = null,
): void {
  const derived = derivedWalletBalance(fromRow, deltas);
  const available = previous
    ? addBackPreviousTransfer(derived, previous, dto.fromWalletId)
    : derived;

  if (!hasSufficientBalance(available, dto.amount)) {
    throw new TransferOperationError("INSUFFICIENT_FUNDS");
  }
}
