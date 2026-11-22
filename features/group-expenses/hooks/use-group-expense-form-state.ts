import { useState } from "react";

import type { CurrencyCode } from "@/shared/constants/currencies";
import { formatDateInput } from "@/shared/utils/date";

import type { GroupExpenseFieldErrors } from "../schemas/group-expense.schema";
import type { ExpenseSplitMode } from "../types/group-expense.types";
import {
  switchGroupExpenseSplitMode,
  updateGroupExpenseAmount,
  updateGroupSplitValueText,
} from "../utils/group-expense-form-modes";
import { refreshGroupSplitValueDefaults } from "../utils/group-expense-split-defaults";
import {
  toggleAllGroupExpenseParticipants,
  toggleGroupExpenseParticipant,
} from "../utils/group-expense-participants";
import type { GroupExpenseFormValues } from "../utils/group-expense-form";
import { useGroupExpenseFieldErrors } from "./use-group-expense-field-errors";

export interface UseGroupExpenseFormStateOptions {
  initialValues: GroupExpenseFormValues;
  fieldErrors: GroupExpenseFieldErrors;
}

export interface GroupExpenseFormState {
  values: GroupExpenseFormValues;
  errors: GroupExpenseFieldErrors;
  changeDescription: (value: string) => void;
  changeAmount: (value: string) => void;
  changeCurrency: (currency: CurrencyCode) => void;
  changePayer: (payerId: string) => void;
  selectDate: (isoDate: string) => void;
  toggleParticipant: (userId: string) => void;
  toggleAllParticipants: () => void;
  changeSplitMode: (mode: ExpenseSplitMode) => void;
  changeSplitValue: (userId: string, value: string) => void;
  /** Replaces the local errors with the ones a submit produced. */
  setValidationErrors: (errors: GroupExpenseFieldErrors) => void;
}

/** Value state and change handlers of the group-expense form. */
export function useGroupExpenseFormState({
  initialValues,
  fieldErrors,
}: UseGroupExpenseFormStateOptions): GroupExpenseFormState {
  const [values, setValues] = useState<GroupExpenseFormValues>(initialValues);
  const { errors, clearError, setValidationErrors } =
    useGroupExpenseFieldErrors(fieldErrors);

  function changeDescription(value: string) {
    setValues((current) => ({ ...current, description: value }));
    clearError("description");
  }

  function changeAmount(value: string) {
    setValues((current) => updateGroupExpenseAmount(current, value));
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

  function selectDate(isoDate: string) {
    setValues((current) => ({
      ...current,
      date: isoDate,
      dateText: formatDateInput(isoDate),
    }));
    clearError("date");
  }

  function toggleParticipant(userId: string) {
    setValues((current) =>
      refreshGroupSplitValueDefaults(
        toggleGroupExpenseParticipant(current, userId),
      ),
    );
    clearError("participants");
  }

  function toggleAllParticipants() {
    setValues((current) =>
      refreshGroupSplitValueDefaults(
        toggleAllGroupExpenseParticipants(current),
      ),
    );
    clearError("participants");
  }

  function changeSplitMode(mode: ExpenseSplitMode) {
    setValues((current) => switchGroupExpenseSplitMode(current, mode));
    clearError("splitMode", "participants");
  }

  function changeSplitValue(userId: string, value: string) {
    setValues((current) => updateGroupSplitValueText(current, userId, value));
    clearError("participants");
  }

  return {
    values,
    errors,
    changeDescription,
    changeAmount,
    changeCurrency,
    changePayer,
    selectDate,
    toggleParticipant,
    toggleAllParticipants,
    changeSplitMode,
    changeSplitValue,
    setValidationErrors,
  };
}
