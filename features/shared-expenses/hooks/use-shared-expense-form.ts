import { useState } from "react";

import type { CurrencyCode } from "@/shared/constants/currencies";
import { parseDateInput } from "@/shared/utils/date";

import {
  toSharedExpenseFieldErrors,
  validateSharedExpenseInput,
  type SharedExpenseFieldErrors,
} from "../schemas/shared-expense.schema";
import type {
  ExpenseSplitMode,
  SharedExpenseInput,
} from "../types/shared-expense.types";
import {
  getSharedExpenseParticipantIds,
  resolvePayerId,
  toSharedExpenseInput,
  type SharedExpenseFormValues,
} from "../utils/shared-expense-form";
import {
  refreshSplitValueDefaults,
  switchExpenseSplitMode,
  updateAmountAndFixedSplit,
  updateSplitValueText,
} from "../utils/shared-expense-form-modes";

export interface UseSharedExpenseFormOptions {
  initialValues: SharedExpenseFormValues;
  fieldErrors: SharedExpenseFieldErrors;
  onSubmit: (input: SharedExpenseInput) => void;
}

export interface SharedExpenseFormController {
  values: SharedExpenseFormValues;
  /** Local validation merged with the errors returned by the service. */
  errors: SharedExpenseFieldErrors;
  changeDescription: (value: string) => void;
  changeAmount: (value: string) => void;
  changeCurrency: (currency: CurrencyCode) => void;
  changePayer: (payerId: string) => void;
  changeFriend: (friendUid: string) => void;
  changeDateText: (text: string) => void;
  changeSplitMode: (mode: ExpenseSplitMode) => void;
  changeSplitValue: (userId: string, value: string) => void;
  submit: () => void;
}

/** Owns the shared-expense form values; the screen only receives the payload. */
export function useSharedExpenseForm({
  initialValues,
  fieldErrors,
  onSubmit,
}: UseSharedExpenseFormOptions): SharedExpenseFormController {
  const [values, setValues] = useState<SharedExpenseFormValues>(initialValues);
  const [localErrors, setLocalErrors] = useState<SharedExpenseFieldErrors>({});

  const errors: SharedExpenseFieldErrors = { ...localErrors, ...fieldErrors };

  function clearError(field: keyof SharedExpenseFieldErrors) {
    setLocalErrors((current) => {
      if (!(field in current)) return current;

      const next = { ...current };
      delete next[field];
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
    setValues((current) => ({ ...current, currency }));
    clearError("currency");
  }

  function changePayer(payerId: string) {
    setValues((current) => ({ ...current, payerId }));
    clearError("payerId");
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
    clearError("participants");
    clearError("payerId");
  }

  function changeDateText(text: string) {
    const isoDate = parseDateInput(text) ?? "";
    setValues((current) => ({ ...current, dateText: text, date: isoDate }));
    clearError("date");
  }

  function changeSplitMode(mode: ExpenseSplitMode) {
    setValues((current) => switchExpenseSplitMode(current, mode));
    clearError("splitMode");
    clearError("participants");
  }

  function changeSplitValue(userId: string, value: string) {
    setValues((current) => updateSplitValueText(current, userId, value));
    clearError("participants");
  }

  function submit() {
    const input = toSharedExpenseInput(values);
    const validation = validateSharedExpenseInput(input, values.viewerUid);

    if (!validation.ok) {
      setLocalErrors(toSharedExpenseFieldErrors(validation.error));
      return;
    }

    setLocalErrors({});
    onSubmit(input);
  }

  return {
    values,
    errors,
    changeDescription,
    changeAmount,
    changeCurrency,
    changePayer,
    changeFriend,
    changeDateText,
    changeSplitMode,
    changeSplitValue,
    submit,
  };
}
