import { WalletOperationError } from "../services/wallet.errors";
import { roundMoney } from "../utils/money";

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
