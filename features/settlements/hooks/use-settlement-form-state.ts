import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import type { Category } from "@/features/categories/types/category.types";

import {
  formatSettlementAmountInput,
  getSettlementCurrencyOption,
  viewerIsCreditorFor,
  type SettlementCurrencyOption,
  type SettlementFormValues,
} from "../utils/settlement-form";
import { getSettlementDefaultCategoryId } from "../utils/settlement-form-options";

export interface SettlementFormState {
  values: SettlementFormValues;
  setValues: Dispatch<SetStateAction<SettlementFormValues>>;
  boundCents: number;
  resolvedCreditor: boolean;
  defaultCategoryId: string;
  option: SettlementCurrencyOption | null;
}

export interface UseSettlementFormStateOptions {
  initialValues: SettlementFormValues;
  options: readonly SettlementCurrencyOption[];
  debtCents: number;
  viewerIsCreditor: boolean;
  categories: readonly Category[];
}

/**
 * Draft values plus the bound and direction of the selected currency. A new
 * pair or currency replaces the draft; a background balance refresh keeps the
 * typed text in partial mode and re-syncs the locked amount in total mode.
 */
export function useSettlementFormState({
  initialValues,
  options,
  debtCents,
  viewerIsCreditor,
  categories,
}: UseSettlementFormStateOptions): SettlementFormState {
  const [values, setValues] = useState<SettlementFormValues>(initialValues);
  const resetKey = `${initialValues.viewerUid}|${initialValues.friendUid}|${initialValues.currency}`;
  const lastResetKey = useRef(resetKey);

  useEffect(() => {
    if (lastResetKey.current === resetKey) return;

    lastResetKey.current = resetKey;
    setValues(initialValues);
  }, [initialValues, resetKey]);

  const option = getSettlementCurrencyOption(options, values.currency);
  const boundCents = option?.debtCents ?? debtCents;
  const resolvedCreditor = option
    ? viewerIsCreditorFor(option)
    : viewerIsCreditor;

  // "Total" is a contract, not a snapshot: if the pair debt refreshes while the
  // form is open, the locked amount must follow it. The service would reject an
  // overpayment, but a stale lower amount would silently save as partial.
  useEffect(() => {
    if (values.mode !== "total") return;

    const nextAmount = formatSettlementAmountInput(boundCents);
    if (values.amount === nextAmount) return;

    setValues((current) =>
      current.mode === "total" ? { ...current, amount: nextAmount } : current,
    );
  }, [boundCents, values.amount, values.mode, setValues]);

  return {
    values,
    setValues,
    boundCents,
    resolvedCreditor,
    defaultCategoryId: getSettlementDefaultCategoryId(categories),
    option,
  };
}
