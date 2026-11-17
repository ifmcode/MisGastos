import { useState } from "react";

import type { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { parseDateInput } from "@/shared/utils/date";

import type { SharedExpenseFieldErrors } from "../schemas/shared-expense.schema";
import type { ExpenseSplitMode } from "../types/shared-expense.types";
import {
  getSharedExpenseParticipantIds,
  resolvePayerId,
  type SharedExpenseFormValues,
} from "../utils/shared-expense-form";
import {
  refreshSplitValueDefaults,
  switchExpenseSplitMode,
  updateAmountAndFixedSplit,
  updateSplitValueText,
} from "../utils/shared-expense-form-modes";
import {
  selectSharedExpenseCategory,
  selectSharedExpenseCurrency,
  selectSharedExpensePayer,
  selectSharedExpenseWallet,
} from "../utils/shared-expense-link-values";

export interface UseSharedExpenseFormStateOptions {
  initialValues: SharedExpenseFormValues;
  fieldErrors: SharedExpenseFieldErrors;
  /** Owner wallets, read only to drop a link whose currency no longer matches. */
  wallets: readonly Wallet[];
}

export interface SharedExpenseFormState {
  values: SharedExpenseFormValues;
  /** Local validation merged with the errors returned by the service. */
  errors: SharedExpenseFieldErrors;
  changeDescription: (value: string) => void;
  changeAmount: (value: string) => void;
  changeCurrency: (currency: CurrencyCode) => void;
  changePayer: (payerId: string) => void;
  changeWallet: (walletId: string) => void;
  changeCategory: (categoryId: string) => void;
  changeFriend: (friendUid: string) => void;
  changeDateText: (text: string) => void;
  changeSplitMode: (mode: ExpenseSplitMode) => void;
  changeSplitValue: (userId: string, value: string) => void;
  /** Replaces the local errors with the ones a submit produced. */
  setValidationErrors: (errors: SharedExpenseFieldErrors) => void;
}

/** Value state and change handlers of the shared-expense form. */
export function useSharedExpenseFormState({
  initialValues,
  fieldErrors,
  wallets,
}: UseSharedExpenseFormStateOptions): SharedExpenseFormState {
  const [values, setValues] = useState<SharedExpenseFormValues>(initialValues);
  const [localErrors, setLocalErrors] = useState<SharedExpenseFieldErrors>({});

  const errors: SharedExpenseFieldErrors = { ...localErrors, ...fieldErrors };

  function clearError(...fields: (keyof SharedExpenseFieldErrors)[]) {
    setLocalErrors((current) => {
      const found = fields.filter((field) => field in current);
      if (found.length === 0) return current;

      const next = { ...current };
      found.forEach((field) => delete next[field]);
      return next;
    });
  }

  function changeDescription(value: string) {
    setValues((current) => ({ ...current, description: value }));
    clearError("description");
  }

  function changeAmount(value: string) {
    setValues((current) => updateAmountAndFixedSplit(current, value));
    clearError("amount");
  }

  function changeCurrency(currency: CurrencyCode) {
    setValues((current) =>
      selectSharedExpenseCurrency(current, currency, wallets),
    );
    clearError("currency", "walletId");
  }

  function changePayer(payerId: string) {
    setValues((current) => selectSharedExpensePayer(current, payerId));
    clearError("payerId", "walletId");
  }

  function changeWallet(walletId: string) {
    setValues((current) => selectSharedExpenseWallet(current, walletId));
    clearError("walletId");
  }

  function changeCategory(categoryId: string) {
    setValues((current) => selectSharedExpenseCategory(current, categoryId));
  }

  function changeFriend(friendUid: string) {
    setValues((current) => {
      const next = { ...current, friendUid };
      const payerId = resolvePayerId(
        current.payerId,
        getSharedExpenseParticipantIds(next),
        current.viewerUid,
      );

      return refreshSplitValueDefaults({ ...next, payerId });
    });
    clearError("participants", "payerId");
  }

  function changeDateText(text: string) {
    const isoDate = parseDateInput(text) ?? "";
    setValues((current) => ({ ...current, dateText: text, date: isoDate }));
    clearError("date");
  }

  function changeSplitMode(mode: ExpenseSplitMode) {
    setValues((current) => switchExpenseSplitMode(current, mode));
    clearError("splitMode", "participants");
  }

  function changeSplitValue(userId: string, value: string) {
    setValues((current) => updateSplitValueText(current, userId, value));
    clearError("participants");
  }

  return {
    values,
    errors,
    changeDescription,
    changeAmount,
    changeCurrency,
    changePayer,
    changeWallet,
    changeCategory,
    changeFriend,
    changeDateText,
    changeSplitMode,
    changeSplitValue,
    setValidationErrors: setLocalErrors,
  };
}
