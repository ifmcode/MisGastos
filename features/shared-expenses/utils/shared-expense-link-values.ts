import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";

import { getSharedExpenseCategoryId } from "../services/shared-expense-category";
import type { SharedExpenseFormValues } from "./shared-expense-form";

/**
 * Wallet and category only exist for the linked movement of the payer, so a
 * payer change to the friend drops both instead of persisting a stale wallet.
 */
export function selectSharedExpensePayer(
  values: SharedExpenseFormValues,
  payerId: string,
): SharedExpenseFormValues {
  if (payerId === values.payerId) return values;

  // Changing the payer also changes who owns the wallet; keeping the previous
  // one would leave the friend's wallet selected for the viewer.
  return { ...values, payerId, walletId: "", categoryId: "" };
}

/**
 * Selecting a wallet defaults the movement category to "Gastos compartidos"
 * unless the user already picked one; clearing the wallet clears the category.
 */
export function selectSharedExpenseWallet(
  values: SharedExpenseFormValues,
  walletId: string,
): SharedExpenseFormValues {
  if (walletId.length === 0) {
    return { ...values, walletId: "", categoryId: "" };
  }

  const categoryId =
    values.categoryId.length > 0
      ? values.categoryId
      : getSharedExpenseCategoryId(values.viewerUid);

  return { ...values, walletId, categoryId };
}

export function selectSharedExpenseCategory(
  values: SharedExpenseFormValues,
  categoryId: string,
): SharedExpenseFormValues {
  return { ...values, categoryId };
}

/**
 * A wallet keeps its own currency, so switching the expense currency away from
 * the selected wallet clears the link and its category.
 */
export function selectSharedExpenseCurrency(
  values: SharedExpenseFormValues,
  currency: CurrencyCode,
  wallets: readonly Wallet[],
): SharedExpenseFormValues {
  const wallet = wallets.find((item) => item.id === values.walletId);

  if (wallet && wallet.currency !== currency) {
    return { ...values, currency, walletId: "", categoryId: "" };
  }

  return { ...values, currency };
}
