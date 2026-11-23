import { useState } from "react";

import type { Wallet } from "@/features/wallets/types/wallet.types";
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
  toggleGroupExpenseParticipant,
} from "../utils/group-expense-participants";
import type { GroupExpenseFormValues } from "../utils/group-expense-form";
import { useGroupExpenseFieldErrors } from "./use-group-expense-field-errors";
import {
  useGroupExpenseLinkState,
  type GroupExpenseLinkState,
} from "./use-group-expense-link-state";

export interface UseGroupExpenseFormStateOptions {
  initialValues: GroupExpenseFormValues;
  fieldErrors: GroupExpenseFieldErrors;
  /** Owner wallets, read only to drop a link whose currency no longer matches. */
  wallets: readonly Wallet[];
}

export interface GroupExpenseFormState extends GroupExpenseLinkState {
  values: GroupExpenseFormValues;
  errors: GroupExpenseFieldErrors;
  changeDescription: (value: string) => void;
  changeAmount: (value: string) => void;
  selectDate: (isoDate: string) => void;
  toggleParticipant: (userId: string) => void;
  changeSplitMode: (mode: ExpenseSplitMode) => void;
  changeSplitValue: (userId: string, value: string) => void;
  /** Replaces the local errors with the ones a submit produced. */
  setValidationErrors: (errors: GroupExpenseFieldErrors) => void;
}

/** Value state and change handlers of the group-expense form. */
export function useGroupExpenseFormState({
  initialValues,
  fieldErrors,
  wallets,
}: UseGroupExpenseFormStateOptions): GroupExpenseFormState {
  const [values, setValues] = useState<GroupExpenseFormValues>(initialValues);
  const { errors, clearError, setValidationErrors } =
    useGroupExpenseFieldErrors(fieldErrors);
  const link = useGroupExpenseLinkState({ setValues, wallets, clearError });

  function changeDescription(value: string) {
    setValues((current) => ({ ...current, description: value }));
    clearError("description");
  }

  function changeAmount(value: string) {
    setValues((current) => updateGroupExpenseAmount(current, value));
    clearError("amount");
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
    ...link,
    changeDescription,
    changeAmount,
    selectDate,
    toggleParticipant,
    changeSplitMode,
    changeSplitValue,
    setValidationErrors,
  };
}
