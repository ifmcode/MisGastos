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

/** Wallet effect of a social movement with an optional personal mirror. */
export interface SocialWalletEffect {
  walletId: string;
  signedAmount: number;
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

function readCents(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return roundMoney(value);
}

/**
 * A shared or group expense debits the payer's wallet by `amountCents`. The
 * wallet is the payer's own; an expense without a wallet link has no effect.
 */
export function readSocialExpenseEffect(
  snapshot: Record<string, unknown>,
): SocialWalletEffect | null {
  const walletId = readWalletId(snapshot, "walletId");
  const amountCents = readCents(snapshot.amountCents);

  if (!walletId || amountCents === null) return null;

  return { walletId, signedAmount: roundMoney(-amountCents / 100) };
}

/**
 * A settlement credits the receiver's wallet by `amountCents`; `receive` is
 * used for a delete so the reverted sign stays explicit.
 */
export function readSocialSettlementEffect(
  snapshot: Record<string, unknown>,
): SocialWalletEffect | null {
  const walletId = readWalletId(snapshot, "receiverWalletId");
  const amountCents = readCents(snapshot.amountCents);

  if (!walletId || amountCents === null) return null;

  return { walletId, signedAmount: roundMoney(amountCents / 100) };
}
