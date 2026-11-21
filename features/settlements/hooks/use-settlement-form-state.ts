import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import type { Category } from "@/features/categories/types/category.types";

import {
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
 * pair, or a refresh that changes the default currency, replaces the draft;
 * a refresh of the selected currency's debt only moves the bound, so the typed
 * amount is never overwritten.
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

  return {
    values,
    setValues,
    boundCents,
    resolvedCreditor,
    defaultCategoryId: getSettlementDefaultCategoryId(categories),
    option,
  };
}
