import { isCurrencyCode } from "@/shared/constants/currencies";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";

import type {
  CreateTransactionDto,
  TransactionType,
} from "@/features/transactions/types/transaction.types";
import type { CreateTransferDto } from "@/features/transfers/types/transfer.types";

function readRequiredString(
  snapshot: Record<string, unknown>,
  key: string,
): string {
  const value = snapshot[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SyncMutationError("INVALID", "SYNC_SNAPSHOT_INVALID");
  }

  return value;
}

function readAmount(snapshot: Record<string, unknown>): number {
  const value = snapshot.amount;

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new SyncMutationError("INVALID", "SYNC_SNAPSHOT_INVALID");
  }

  return value;
}

function readCurrency(snapshot: Record<string, unknown>) {
  const value = snapshot.currency;
  if (!isCurrencyCode(value)) {
    throw new SyncMutationError("INVALID", "SYNC_SNAPSHOT_INVALID");
  }

  return value;
}

function readOptionalString(
  snapshot: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = snapshot[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function readTransactionType(
  snapshot: Record<string, unknown>,
): TransactionType {
  const value = snapshot.type;
  if (value !== "expense" && value !== "income") {
    throw new SyncMutationError("INVALID", "SYNC_SNAPSHOT_INVALID");
  }

  return value;
}

/** Rebuilds the create/update payload of a queued transaction movement. */
export function readTransactionDto(
  snapshot: Record<string, unknown>,
): CreateTransactionDto {
  const notes = readOptionalString(snapshot, "notes");
  const deletedAt = readOptionalString(snapshot, "deletedAt");

  return {
    id: readRequiredString(snapshot, "id"),
    type: readTransactionType(snapshot),
    amount: readAmount(snapshot),
    currency: readCurrency(snapshot),
    walletId: readRequiredString(snapshot, "walletId"),
    categoryId: readRequiredString(snapshot, "categoryId"),
    concept: readRequiredString(snapshot, "concept"),
    date: readRequiredString(snapshot, "date"),
    ...(notes ? { notes } : {}),
    ...(deletedAt ? { deletedAt } : {}),
  };
}

/** Rebuilds the create/update payload of a queued transfer. */
export function readTransferDto(
  snapshot: Record<string, unknown>,
): CreateTransferDto {
  const notes = readOptionalString(snapshot, "notes");

  return {
    id: readRequiredString(snapshot, "id"),
    fromWalletId: readRequiredString(snapshot, "fromWalletId"),
    toWalletId: readRequiredString(snapshot, "toWalletId"),
    amount: readAmount(snapshot),
    currency: readCurrency(snapshot),
    date: readRequiredString(snapshot, "date"),
    ...(notes ? { notes } : {}),
  };
}
