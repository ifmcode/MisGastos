import { WalletOperationError } from "../services/wallet.errors";
import { roundMoney } from "@/shared/utils/money";

const MAX_BATCH_WRITES = 450;

export function readString(
  data: Record<string, unknown>,
  key: string,
): string {
  const value = data[key];
  return typeof value === "string" ? value : "";
}

export function readAmount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? roundMoney(value)
    : 0;
}

export function readBalance(data: Record<string, unknown>): number {
  if (typeof data.balance === "number" && Number.isFinite(data.balance)) {
    return roundMoney(data.balance);
  }

  return readAmount(data.initialBalance);
}

/**
 * A soft-deleted movement was already reverted from its wallet, so it must not
 * contribute to the reassigned net or to the usage count again.
 */
export function isSoftDeletedMovement(data: Record<string, unknown>): boolean {
  const deletedAt = data.deletedAt;

  return typeof deletedAt === "string" && deletedAt.trim().length > 0;
}

export function getSignedAmount(data: Record<string, unknown>): number {
  const amount = readAmount(data.amount);

  if (data.type === "income") return amount;
  if (data.type === "expense") return -amount;
  return 0;
}

export function assertBatchSize(writes: number): void {
  if (writes > MAX_BATCH_WRITES) {
    throw new WalletOperationError("TOO_MANY_MOVEMENTS");
  }
}
