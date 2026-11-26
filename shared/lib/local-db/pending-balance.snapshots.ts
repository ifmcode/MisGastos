import { roundMoney } from "@/shared/utils/money";
import { getSignedTransactionAmount } from "@/shared/utils/transaction-balance";

type MovementType = "expense" | "income";

export interface TransactionEffect {
  walletId: string;
  signedAmount: number;
}

export interface TransferEffect {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
}

export function isSnapshotRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readWalletId(
  snapshot: Record<string, unknown>,
  column: string,
): string | null {
  const value = snapshot[column];
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readPositiveAmount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return roundMoney(value);
}

function readMovementType(snapshot: Record<string, unknown>): MovementType | null {
  return snapshot.type === "expense" || snapshot.type === "income"
    ? snapshot.type
    : null;
}

/** Signed effect of a transaction snapshot, or null when it is malformed. */
export function readTransactionEffect(
  snapshot: Record<string, unknown>,
): TransactionEffect | null {
  const walletId = readWalletId(snapshot, "walletId");
  const type = readMovementType(snapshot);
  const amount = readPositiveAmount(snapshot.amount);

  if (!walletId || !type || amount === null) return null;

  return { walletId, signedAmount: getSignedTransactionAmount({ type, amount }) };
}

/** Transfer effect of a snapshot, or null when it is malformed or self-referential. */
export function readTransferEffect(
  snapshot: Record<string, unknown>,
): TransferEffect | null {
  const fromWalletId = readWalletId(snapshot, "fromWalletId");
  const toWalletId = readWalletId(snapshot, "toWalletId");
  const amount = readPositiveAmount(snapshot.amount);

  if (!fromWalletId || !toWalletId || amount === null) return null;
  if (fromWalletId === toWalletId) return null;

  return { fromWalletId, toWalletId, amount };
}
