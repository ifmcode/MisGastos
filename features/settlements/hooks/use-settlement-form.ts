import { useState } from "react";

import { formatDateInput } from "@/shared/utils/date";

import type { SettlementFieldErrors } from "../schemas/settlement-validation.types";
import {
  getSettlementAmountIssue,
  getSettlementDateIssue,
  selectSettlementWallet,
  toSettlementInput,
} from "../utils/settlement-form";
import type {
  SettlementFormController,
  UseSettlementFormOptions,
} from "./settlement-form-controller.types";
import { useSettlementFormState } from "./use-settlement-form-state";

export type {
  SettlementAmountIssue,
  SettlementDateIssue,
  SettlementFormController,
  UseSettlementFormOptions,
} from "./settlement-form-controller.types";

/**
 * Values of the settlement form. The debt bound and the direction always follow
 * the currency option resolved by the debt step; the currency is immutable
 * inside the form, so it cannot settle a different amount than the one shown in
 * the debt card.
 */
export function useSettlementForm({
  initialValues,
  options,
  debtCents,
  viewerIsCreditor,
  fieldErrors,
  onSubmit,
}: UseSettlementFormOptions): SettlementFormController {
  const state = useSettlementFormState({
    initialValues,
    options,
    debtCents,
    viewerIsCreditor,
  });
  const [localErrors, setLocalErrors] = useState<SettlementFieldErrors>({});
  const { values, setValues, boundCents, resolvedCreditor } = state;
  const errors: SettlementFieldErrors = { ...localErrors, ...fieldErrors };

  function clearErrors(...fields: (keyof SettlementFieldErrors)[]) {
    setLocalErrors((current) => {
      const found = fields.filter((field) => field in current);
      if (found.length === 0) return current;

      const next = { ...current };
      found.forEach((field) => delete next[field]);
      return next;
    });
  }

  function changeAmount(amount: string) {
    setValues((current) => ({ ...current, amount }));
    clearErrors("amount");
  }

  function selectDate(isoDate: string) {
    setValues((current) => ({
      ...current,
      date: isoDate,
      dateText: formatDateInput(isoDate),
    }));
    clearErrors("date");
  }

  function changeNote(note: string) {
    setValues((current) => ({ ...current, note }));
    clearErrors("note");
  }

  function changeWallet(walletId: string) {
    setValues((current) => selectSettlementWallet(current, walletId));
    clearErrors("walletId", "categoryId");
  }

  function changeCategory(categoryId: string) {
    setValues((current) => ({ ...current, categoryId }));
    clearErrors("categoryId");
  }

  function submit() {
    const dateIssue = getSettlementDateIssue(values);
    if (dateIssue) {
      setLocalErrors((current) => ({ ...current, date: dateIssue }));
      return;
    }

    if (getSettlementAmountIssue(values, boundCents)) return;

    onSubmit(toSettlementInput(values, resolvedCreditor));
  }

  return {
    ...state,
    errors,
    amountIssue: getSettlementAmountIssue(values, boundCents),
    dateIssue: getSettlementDateIssue(values),
    changeAmount,
    selectDate,
    changeNote,
    changeWallet,
    changeCategory,
    submit,
  };
}
