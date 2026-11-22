import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import {
  getSettlementCurrencyOption,
  viewerIsCreditorFor,
  type SettlementCurrencyOption,
  type SettlementFormValues,
} from "../utils/settlement-form";

export interface SettlementFormState {
  values: SettlementFormValues;
  setValues: Dispatch<SetStateAction<SettlementFormValues>>;
  boundCents: number;
  resolvedCreditor: boolean;
  option: SettlementCurrencyOption | null;
}

export interface UseSettlementFormStateOptions {
  initialValues: SettlementFormValues;
  options: readonly SettlementCurrencyOption[];
  debtCents: number;
  viewerIsCreditor: boolean;
}

/**
 * Draft values plus the bound and direction of the resolved currency. A
 * different pair or currency replaces the draft; a refresh of the same
 * currency's debt only moves the bound, so the typed amount is never
 * overwritten.
 */
export function useSettlementFormState({
  initialValues,
  options,
  debtCents,
  viewerIsCreditor,
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
    option,
  };
}
