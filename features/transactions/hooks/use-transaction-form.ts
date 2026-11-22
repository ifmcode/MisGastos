import { useMemo, useState } from "react";

import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { getCurrencySymbol } from "@/features/wallets/utils/money";

import {
  toTransactionFieldErrors,
  validateTransactionInput,
  TransactionInput,
  TransactionValidationErrors,
} from "../schemas/transaction.schema";
import { TransactionFormValues } from "../types/transaction.types";
import { getDefaultMovementIsoDate } from "@/shared/utils/date-defaults";
import {
  findTransactionCategory,
  getCategoriesForType,
  getDefaultCategoryId,
} from "../utils/transaction-options";

export interface UseTransactionFormOptions {
  wallets: Wallet[];
  categories: readonly Category[];
  initialValues: TransactionFormValues;
  fieldErrors: TransactionValidationErrors;
  onSubmit: (input: TransactionInput) => void;
}

export interface UseTransactionFormResult {
  values: TransactionFormValues;
  errors: TransactionValidationErrors;
  categories: ReturnType<typeof getCategoriesForType>;
  symbol: string;
  updateValue: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  selectDate: (isoDate: string) => void;
  submit: () => void;
}

/** Owns the transaction form values, derived options and submit flow. */
export function useTransactionForm({
  wallets,
  categories,
  initialValues,
  fieldErrors,
  onSubmit,
}: UseTransactionFormOptions): UseTransactionFormResult {
  const [values, setValues] = useState<TransactionFormValues>(() => ({
    ...initialValues,
    date: initialValues.date || getDefaultMovementIsoDate(),
  }));
  const [localErrors, setLocalErrors] = useState<TransactionValidationErrors>(
    {},
  );

  const errors: TransactionValidationErrors = {
    ...localErrors,
    ...fieldErrors,
  };

  const typeCategories = useMemo(
    () => getCategoriesForType(categories, values.type),
    [categories, values.type],
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
        const currentCategory = findTransactionCategory(
          categories,
          next.categoryId,
        );
        if (!currentCategory || currentCategory.type !== typeValue) {
          next.categoryId = getDefaultCategoryId(categories, typeValue);
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

  function selectDate(isoDate: string) {
    updateValue("date", isoDate);
  }

  function submit() {
    const validation = validateTransactionInput(
      {
        type: values.type,
        amount: values.amount,
        currency: selectedWallet?.currency ?? values.currency,
        walletId: values.walletId,
        categoryId: values.categoryId,
        concept: values.concept,
        notes: values.notes,
        date: values.date,
      },
      categories,
    );

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
    categories: typeCategories,
    symbol: getCurrencySymbol(selectedWallet?.currency ?? values.currency),
    updateValue,
    selectDate,
    submit,
  };
}
