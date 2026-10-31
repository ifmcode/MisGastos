import { CurrencyCode } from "@/shared/constants/currencies";
import { Wallet } from "@/features/wallets/types/wallet.types";

import {
  toTransferFieldErrors,
  TransferInput,
  TransferValidationErrors,
  validateTransferInput,
} from "../schemas/transfer.schema";
import { TransferFormValues } from "../types/transfer.types";
import { hasSufficientBalance } from "./transfer-balance";
import { getInsufficientBalanceMessage } from "./transfer-form-derivations";

export interface ValidateTransferFormOptions {
  values: TransferFormValues;
  fromWallet: Wallet | undefined;
  availableSourceBalance: number;
  currency: CurrencyCode;
}

export type TransferFormValidation =
  | { ok: true; value: TransferInput }
  | { ok: false; errors: TransferValidationErrors };

/** Validates fields first, then checks the source wallet has enough balance. */
export function validateTransferForm({
  values,
  fromWallet,
  availableSourceBalance,
  currency,
}: ValidateTransferFormOptions): TransferFormValidation {
  const validation = validateTransferInput({
    fromWalletId: values.fromWalletId,
    toWalletId: values.toWalletId,
    amount: values.amount,
    currency,
    notes: values.notes,
    date: values.date,
  });

  if (!validation.ok) {
    return { ok: false, errors: toTransferFieldErrors(validation.error) };
  }

  if (
    !fromWallet ||
    !hasSufficientBalance(availableSourceBalance, validation.value.amount)
  ) {
    return {
      ok: false,
      errors: {
        amount: getInsufficientBalanceMessage(availableSourceBalance, currency),
      },
    };
  }

  return { ok: true, value: validation.value };
}
