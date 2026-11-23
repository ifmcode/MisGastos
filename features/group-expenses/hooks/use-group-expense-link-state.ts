import type { Dispatch, SetStateAction } from "react";

import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";

import type { GroupExpenseFieldErrors } from "../schemas/group-expense.schema";
import type { GroupExpenseFormValues } from "../utils/group-expense-form";
import {
  selectGroupExpenseCategory,
  selectGroupExpenseCurrency,
  selectGroupExpensePayer,
  selectGroupExpenseWallet,
  selectGroupExpenseWalletRegistration,
} from "../utils/group-expense-link-values";

export interface UseGroupExpenseLinkStateOptions {
  setValues: Dispatch<SetStateAction<GroupExpenseFormValues>>;
  /** Owner wallets, read only to drop a link whose currency no longer matches. */
  wallets: readonly Wallet[];
  clearError: (...fields: (keyof GroupExpenseFieldErrors)[]) => void;
}

/** Wallet-link change handlers of the group-expense form. */
export interface GroupExpenseLinkState {
  changeCurrency: (currency: CurrencyCode) => void;
  changePayer: (payerId: string) => void;
  changeWallet: (walletId: string) => void;
  changeCategory: (categoryId: string) => void;
  /** Turns the linked movement on or off; off clears the wallet and category. */
  changeRegisterInWallet: (enabled: boolean) => void;
}

/** Payer, currency and wallet-link handlers, kept pure through the utils. */
export function useGroupExpenseLinkState({
  setValues,
  wallets,
  clearError,
}: UseGroupExpenseLinkStateOptions): GroupExpenseLinkState {
  function changeCurrency(currency: CurrencyCode) {
    setValues((current) =>
      selectGroupExpenseCurrency(current, currency, wallets),
    );
    clearError("currency", "walletId", "categoryId");
  }

  function changePayer(payerId: string) {
    setValues((current) => selectGroupExpensePayer(current, payerId));
    clearError("payerId", "walletId", "categoryId");
  }

  function changeWallet(walletId: string) {
    setValues((current) => selectGroupExpenseWallet(current, walletId));
    clearError("walletId", "categoryId");
  }

  function changeCategory(categoryId: string) {
    setValues((current) => selectGroupExpenseCategory(current, categoryId));
    clearError("categoryId");
  }

  function changeRegisterInWallet(enabled: boolean) {
    setValues((current) =>
      selectGroupExpenseWalletRegistration(current, enabled),
    );
    clearError("walletId", "categoryId");
  }

  return {
    changeCurrency,
    changePayer,
    changeWallet,
    changeCategory,
    changeRegisterInWallet,
  };
}
