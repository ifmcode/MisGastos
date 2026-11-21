import { useState } from "react";

import type { CurrencyCode } from "@/shared/constants/currencies";
import { parseDateInput } from "@/shared/utils/date";

import type { SettlementFieldErrors } from "../schemas/settlement-validation.types";
import {
  getSettlementAmountIssue,
  getSettlementDateIssue,
  selectSettlementCurrency,
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
 * the selected currency option, so a currency change cannot settle a different
 * amount than the one shown in the debt card.
 */
export function useSettlementForm({
  initialValues,
  options,
  debtCents,
  viewerIsCreditor,
  categories,
  fieldErrors,
  onSubmit,
}: UseSettlementFormOptions): SettlementFormController {
  const state = useSettlementFormState({
    initialValues,
    options,
    debtCents,
    viewerIsCreditor,
    categories,
  });
  const [localErrors, setLocalErrors] = useState<SettlementFieldErrors>({});
  const { values, setValues, boundCents, resolvedCreditor, defaultCategoryId } =
    state;
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

  function changeCurrency(currency: CurrencyCode) {
    setValues((current) => selectSettlementCurrency(current, currency, options));
    clearErrors("currency", "amount", "walletId", "categoryId");
  }

  function changeAmount(amount: string) {
    setValues((current) => ({ ...current, amount }));
    clearErrors("amount");
  }

  function changeDateText(text: string) {
    setValues((current) => ({
      ...current,
      dateText: text,
      date: parseDateInput(text) ?? "",
    }));
    clearErrors("date");
  }

  function changeNote(note: string) {
    setValues((current) => ({ ...current, note }));
    clearErrors("note");
  }

  function changeWallet(walletId: string) {
    setValues((current) =>
      selectSettlementWallet(current, walletId, defaultCategoryId),
    );
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
    changeCurrency,
    changeAmount,
    changeDateText,
    changeNote,
    changeWallet,
    changeCategory,
    submit,
  };
}
