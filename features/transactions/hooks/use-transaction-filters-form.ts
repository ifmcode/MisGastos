import { useState } from "react";

import { formatDateInput, parseDateInput } from "@/shared/utils/date";

import { TransactionFilters } from "../utils/transaction-filters";

export interface UseTransactionFiltersFormOptions {
  filters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
}

export interface TransactionFiltersForm {
  localFilters: TransactionFilters;
  fromIso: string;
  toIso: string;
  updateFilters: (patch: Partial<TransactionFilters>) => void;
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

  function updateFilters(patch: Partial<TransactionFilters>) {
    setLocalFilters((current) => ({ ...current, ...patch }));
  }

  function selectFromDate(isoDate: string) {
    updateFilters({ fromDate: formatDateInput(isoDate) });
  }

  function selectToDate(isoDate: string) {
    updateFilters({ toDate: formatDateInput(isoDate) });
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
    fromIso: parseDateInput(localFilters.fromDate) ?? "",
    toIso: parseDateInput(localFilters.toDate) ?? "",
    updateFilters,
    selectFromDate,
    selectToDate,
    apply,
  };
}
