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
 * Selecting a wallet keeps a real category the user already picked. The
 * deterministic "Gastos compartidos" category is not offered any more, so a
 * legacy default is cleared instead of kept; clearing the wallet drops both.
 */
export function selectSharedExpenseWallet(
  values: SharedExpenseFormValues,
  walletId: string,
): SharedExpenseFormValues {
  if (walletId.length === 0) {
    return { ...values, walletId: "", categoryId: "" };
  }

  const keepsCategory =
    values.categoryId.length > 0 &&
    values.categoryId !== getSharedExpenseCategoryId(values.viewerUid);

  return {
    ...values,
    walletId,
    categoryId: keepsCategory ? values.categoryId : "",
  };
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

/**
 * A movement keeps its wallet currency, so a wallet whose currency differs makes
 * the save fail in the service. Checking it here shows the error before the
 * request; a missing or orphaned wallet returns `null` because only the service
 * can tell whether it still exists.
 */
export function getSharedExpenseWalletCurrencyError(
  values: SharedExpenseFormValues,
  wallets: readonly Wallet[],
): "CURRENCY_MISMATCH" | null {
  const walletId = values.walletId.trim();

  if (walletId.length === 0) return null;

  const wallet = wallets.find((item) => item.id === walletId);

  if (!wallet) return null;

  return wallet.currency === values.currency ? null : "CURRENCY_MISMATCH";
}
