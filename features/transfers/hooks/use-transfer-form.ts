import { useState } from "react";

import { formatDateInput, parseDateInput } from "@/features/transactions/utils/transaction-date";
import { CurrencyCode } from "@/shared/constants/currencies";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { getCurrencySymbol, formatMoney } from "@/features/wallets/utils/money";

import {
  TransferInput,
  TransferValidationErrors,
} from "../schemas/transfer.schema";
import { Transfer, TransferFormValues } from "../types/transfer.types";
import {
  getAvailableDestinations,
  getInitialTransferFormValues,
} from "../utils/transfer-form-derivations";
import { validateTransferForm } from "../utils/validate-transfer-form";
import { useTransferFormDerived } from "./use-transfer-form-derived";

export interface UseTransferFormOptions {
  wallets: Wallet[];
  initialValues: TransferFormValues;
  editingTransfer?: Transfer | null;
  fieldErrors: TransferValidationErrors;
  onSubmit: (input: TransferInput) => void;
}

export interface UseTransferFormResult {
  values: TransferFormValues;
  errors: TransferValidationErrors;
  fromWallet: Wallet | undefined;
  toWallet: Wallet | undefined;
  availableDestinations: Wallet[];
  currency: CurrencyCode;
  symbol: string;
  availableSourceBalance: number;
  projectedSourceBalance: number;
  amountHelper: string | undefined;
  dateText: string;
  canSubmit: boolean;
  updateValue: <K extends keyof TransferFormValues>(
    key: K,
    value: TransferFormValues[K],
  ) => void;
  changeFromWallet: (walletId: string) => void;
  changeDate: (text: string) => void;
  submit: () => void;
}

/** Owns the transfer form values, derived balances and submit flow. */
export function useTransferForm({
  wallets,
  initialValues,
  editingTransfer,
  fieldErrors,
  onSubmit,
}: UseTransferFormOptions): UseTransferFormResult {
  const [values, setValues] = useState<TransferFormValues>(() =>
    getInitialTransferFormValues(initialValues),
  );
  const [localErrors, setLocalErrors] = useState<TransferValidationErrors>({});
  const [dateText, setDateText] = useState(() =>
    values.date ? formatDateInput(values.date) : "",
  );

  const derived = useTransferFormDerived({
    wallets,
    values,
    editingTransfer,
  });

  const errors: TransferValidationErrors = { ...localErrors, ...fieldErrors };

  function clearLocalError(key: keyof TransferFormValues) {
    setLocalErrors((current) => {
      if (!(key in current)) return current;

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateValue<K extends keyof TransferFormValues>(
    key: K,
    value: TransferFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    clearLocalError(key);
  }

  function changeFromWallet(walletId: string) {
    const selectedWallet = wallets.find((wallet) => wallet.id === walletId);
    const destinations = getAvailableDestinations(wallets, walletId);

    setValues((current) => {
      const destinationStillValid = destinations.some(
        (wallet) => wallet.id === current.toWalletId,
      );

      return {
        ...current,
        fromWalletId: walletId,
        currency: selectedWallet?.currency ?? current.currency,
        toWalletId: destinationStillValid
          ? current.toWalletId
          : destinations[0]?.id ?? "",
      };
    });

    setLocalErrors((current) => {
      const next = { ...current };
      delete next.fromWalletId;
      delete next.toWalletId;
      delete next.currency;
      return next;
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
    clearLocalError("date");
  }

  function submit() {
    const result = validateTransferForm({
      values,
      fromWallet: derived.fromWallet,
      availableSourceBalance: derived.availableSourceBalance,
      currency: derived.currency,
    });

    if (!result.ok) {
      setLocalErrors(result.errors);
      return;
    }

    setLocalErrors({});
    onSubmit(result.value);
  }

  return {
    values,
    errors,
    ...derived,
    symbol: getCurrencySymbol(derived.currency),
    amountHelper: derived.fromWallet
      ? `Disponible: ${formatMoney(
          derived.availableSourceBalance,
          derived.currency,
        )} · Saldo resultante: ${formatMoney(
          derived.projectedSourceBalance,
          derived.currency,
        )}`
      : undefined,
    dateText,
    canSubmit: Boolean(derived.fromWallet) && Boolean(derived.toWallet),
    updateValue,
    changeFromWallet,
    changeDate,
    submit,
  };
}
