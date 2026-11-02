import { useState } from "react";

import { formatDateInput, parseDateInput } from "@/shared/utils/date";

import { TransactionFilters } from "../utils/transaction-filters";

export interface UseTransactionFiltersFormOptions {
  filters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
}

export interface TransactionFiltersForm {
  localFilters: TransactionFilters;
  fromText: string;
  toText: string;
  fromIso: string;
  toIso: string;
  updateFilters: (patch: Partial<TransactionFilters>) => void;
  changeFromDate: (text: string) => void;
  changeToDate: (text: string) => void;
  selectFromDate: (isoDate: string) => void;
  selectToDate: (isoDate: string) => void;
  apply: () => void;
}

/** Owns the draft filters of the filters modal until they are applied. */
export function useTransactionFiltersForm({
  filters,
  onApply,
}: UseTransactionFiltersFormOptions): TransactionFiltersForm {
  const [localFilters, setLocalFilters] =
    useState<TransactionFilters>(filters);
  const [fromText, setFromText] = useState(filters.fromDate);
  const [toText, setToText] = useState(filters.toDate);

  function updateFilters(patch: Partial<TransactionFilters>) {
    setLocalFilters((current) => ({ ...current, ...patch }));
  }

  function changeFromDate(text: string) {
    setFromText(text);
    updateFilters({ fromDate: text });
  }

  function changeToDate(text: string) {
    setToText(text);
    updateFilters({ toDate: text });
  }

  function selectFromDate(isoDate: string) {
    changeFromDate(formatDateInput(isoDate));
  }

  function selectToDate(isoDate: string) {
    changeToDate(formatDateInput(isoDate));
  }

  function apply() {
    onApply({
      ...localFilters,
      fromDate: parseDateInput(localFilters.fromDate)
        ? localFilters.fromDate
        : "",
      toDate: parseDateInput(localFilters.toDate) ? localFilters.toDate : "",
    });
  }

  return {
    localFilters,
    fromText,
    toText,
    fromIso: parseDateInput(fromText) ?? "",
    toIso: parseDateInput(toText) ?? "",
    updateFilters,
    changeFromDate,
    changeToDate,
    selectFromDate,
    selectToDate,
    apply,
  };
}
