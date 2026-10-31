import { useMemo, useState } from "react";

import { Wallet } from "@/features/wallets/types/wallet.types";
import { getCurrencySymbol } from "@/features/wallets/utils/money";

import {
  toTransactionFieldErrors,
  validateTransactionInput,
  TransactionInput,
  TransactionValidationErrors,
} from "../schemas/transaction.schema";
import { TransactionFormValues } from "../types/transaction.types";
import {
  formatDateInput,
  getTodayIsoDate,
  parseDateInput,
} from "../utils/transaction-date";
import {
  getCategoriesForType,
  getDefaultCategoryId,
  getTransactionCategory,
  TransactionCategory,
} from "../utils/transaction-options";

export interface UseTransactionFormOptions {
  wallets: Wallet[];
  initialValues: TransactionFormValues;
  fieldErrors: TransactionValidationErrors;
  onSubmit: (input: TransactionInput) => void;
}

export interface UseTransactionFormResult {
  values: TransactionFormValues;
  errors: TransactionValidationErrors;
  categories: readonly TransactionCategory[];
  dateText: string;
  symbol: string;
  updateValue: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  changeDate: (text: string) => void;
  submit: () => void;
}

function getInitialFormValues(
  initialValues: TransactionFormValues,
): TransactionFormValues {
  return {
    ...initialValues,
    date: initialValues.date || getTodayIsoDate(),
  };
}

/** Owns the transaction form values, derived options and submit flow. */
export function useTransactionForm({
  wallets,
  initialValues,
  fieldErrors,
  onSubmit,
}: UseTransactionFormOptions): UseTransactionFormResult {
  const [values, setValues] = useState<TransactionFormValues>(() =>
    getInitialFormValues(initialValues),
  );
  const [localErrors, setLocalErrors] = useState<TransactionValidationErrors>(
    {},
  );
  const [dateText, setDateText] = useState(() =>
    values.date ? formatDateInput(values.date) : "",
  );

  const errors: TransactionValidationErrors = {
    ...localErrors,
    ...fieldErrors,
  };

  const categories = useMemo(
    () => getCategoriesForType(values.type),
    [values.type],
  );

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === values.walletId),
    [wallets, values.walletId],
  );

  function updateValue<K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) {
    setValues((current) => {
      const next = { ...current, [key]: value };

      if (key === "walletId") {
        const wallet = wallets.find((item) => item.id === value);
        if (wallet && next.currency !== wallet.currency) {
          next.currency = wallet.currency;
        }
      }

      if (key === "type") {
        const typeValue = value as TransactionFormValues["type"];
        const currentCategory = getTransactionCategory(next.categoryId);
        if (currentCategory.type !== typeValue) {
          next.categoryId = getDefaultCategoryId(typeValue);
        }
      }

      return next;
    });

    setLocalErrors((current) => {
      if (!(key in current)) return current;

      const nextErrors = { ...current };
      delete nextErrors[key];
      return nextErrors;
    });
  }

  function changeDate(text: string) {
    setDateText(text);

    const parsed = parseDateInput(text);
    if (parsed) {
      updateValue("date", parsed);
      return;
    }

    setValues((current) => ({ ...current, date: "" }));
    setLocalErrors((current) => ({ ...current, date: undefined }));
  }

  function submit() {
    const validation = validateTransactionInput({
      type: values.type,
      amount: values.amount,
      currency: selectedWallet?.currency ?? values.currency,
      walletId: values.walletId,
      categoryId: values.categoryId,
      concept: values.concept,
      notes: values.notes,
      date: values.date,
    });

    if (!validation.ok) {
      setLocalErrors(toTransactionFieldErrors(validation.error));
      return;
    }

    setLocalErrors({});
    onSubmit(validation.value);
  }

  return {
    values,
    errors,
    categories,
    dateText,
    symbol: getCurrencySymbol(selectedWallet?.currency ?? values.currency),
    updateValue,
    changeDate,
    submit,
  };
}
