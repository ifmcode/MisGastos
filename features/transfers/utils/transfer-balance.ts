import { roundMoney } from "@/features/wallets/utils/money";

export interface TransferBalances {
  fromBalance: number;
  toBalance: number;
}

/**
 * A transfer is only valid when the source wallet has enough money. Amounts
 * are always positive because they are validated before reaching this helper.
 */
export function hasSufficientBalance(
  balance: number,
  amount: number,
): boolean {
  return roundMoney(balance) >= roundMoney(amount);
}

/**
 * Moves money between two wallets. Every balance goes through roundMoney to
 * avoid float drift, and the net global balance stays unchanged.
 */
export function applyTransferToBalances(
  fromBalance: number,
  toBalance: number,
  amount: number,
): TransferBalances {
  const normalizedAmount = roundMoney(amount);

  return {
    fromBalance: roundMoney(fromBalance - normalizedAmount),
    toBalance: roundMoney(toBalance + normalizedAmount),
  };
}
