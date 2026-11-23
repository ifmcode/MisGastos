import { getSharedExpenseWalletCurrencyError } from "@/features/shared-expenses/utils/shared-expense-link-values";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";

import type { GroupExpenseFormValues } from "./group-expense-form";

/**
 * Wallet and category only exist for the linked movement of the payer, so a
 * payer change drops both instead of persisting a stale wallet.
 */
export function selectGroupExpensePayer(
  values: GroupExpenseFormValues,
  payerId: string,
): GroupExpenseFormValues {
  if (payerId === values.payerId) return values;

  // Changing the payer also changes who owns the wallet; keeping the previous
  // one would leave another member's wallet selected for the viewer.
  return { ...values, payerId, walletId: "", categoryId: "" };
}

/**
 * Selecting a wallet keeps a real category the user already picked; clearing
 * the wallet drops both because a category cannot outlive its movement.
 */
export function selectGroupExpenseWallet(
  values: GroupExpenseFormValues,
  walletId: string,
): GroupExpenseFormValues {
  if (walletId.length === 0) {
    return { ...values, walletId: "", categoryId: "" };
  }

  return {
    ...values,
    walletId,
  };
}

export function selectGroupExpenseCategory(
  values: GroupExpenseFormValues,
  categoryId: string,
): GroupExpenseFormValues {
  return { ...values, categoryId };
}

/**
 * The registration switch guards the linked movement: turning it off drops the
 * wallet and its category, while turning it on keeps whatever the user already
 * selected so a quick Yes → No → Yes round trip does not lose the choice.
 */
export function selectGroupExpenseWalletRegistration(
  values: GroupExpenseFormValues,
  enabled: boolean,
): GroupExpenseFormValues {
  if (enabled) return { ...values, registerInWallet: true };

  return {
    ...values,
    registerInWallet: false,
    walletId: "",
    categoryId: "",
  };
}

/**
 * A wallet keeps its own currency, so switching the expense currency away from
 * the selected wallet clears the link and its category AND turns the toggle to
 * "No": the save becomes social-only and the service reverts the movement.
 */
export function selectGroupExpenseCurrency(
  values: GroupExpenseFormValues,
  currency: CurrencyCode,
  wallets: readonly Wallet[],
): GroupExpenseFormValues {
  const wallet = wallets.find((item) => item.id === values.walletId);

  if (wallet && wallet.currency !== currency) {
    return {
      ...values,
      currency,
      walletId: "",
      categoryId: "",
      registerInWallet: false,
    };
  }

  return { ...values, currency };
}

/**
 * Same guard as the 1:1 form: a wallet with another currency fails in the
 * service, so the form reports it before the request. The shared pure helper
 * keeps both forms on one rule; an orphaned wallet returns `null`.
 */
export function getGroupExpenseWalletCurrencyError(
  values: GroupExpenseFormValues,
  wallets: readonly Wallet[],
): "CURRENCY_MISMATCH" | null {
  return getSharedExpenseWalletCurrencyError(values, wallets);
}
