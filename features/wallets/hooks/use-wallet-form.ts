import { useState } from "react";

import {
  toWalletFieldErrors,
  validateWalletInput,
  WalletInput,
  WalletValidationErrors,
} from "../schemas/wallet.schema";
import { WalletFormValues } from "../types/wallet.types";
import { DEFAULT_WALLET_FORM_VALUES } from "../utils/wallet-options";

export interface UseWalletFormOptions {
  fieldErrors: WalletValidationErrors;
  onSubmit: (input: WalletInput) => void;
}

export interface UseWalletFormResult {
  values: WalletFormValues;
  errors: WalletValidationErrors;
  updateValue: <K extends keyof WalletFormValues>(
    key: K,
    value: WalletFormValues[K],
  ) => void;
  submit: () => void;
}

/** Owns the wallet form values, validations and submit flow. */
export function useWalletForm({
  fieldErrors,
  onSubmit,
}: UseWalletFormOptions): UseWalletFormResult {
  const [values, setValues] = useState<WalletFormValues>(
    DEFAULT_WALLET_FORM_VALUES,
  );
  const [localErrors, setLocalErrors] = useState<WalletValidationErrors>({});

  const errors: WalletValidationErrors = { ...localErrors, ...fieldErrors };

  function updateValue<K extends keyof WalletFormValues>(
    key: K,
    value: WalletFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setLocalErrors((current) => {
      if (!current[key]) return current;

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function submit() {
    const validation = validateWalletInput(values);

    if (!validation.ok) {
      setLocalErrors(toWalletFieldErrors(validation.error));
      return;
    }

    setLocalErrors({});
    onSubmit(validation.value);
  }

  return { values, errors, updateValue, submit };
}
