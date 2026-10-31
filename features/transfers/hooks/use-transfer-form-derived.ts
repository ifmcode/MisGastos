import { useMemo } from "react";

import { CurrencyCode } from "@/shared/constants/currencies";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { Transfer, TransferFormValues } from "../types/transfer.types";
import {
  getAvailableDestinations,
  getAvailableSourceBalance,
  getProjectedSourceBalance,
} from "../utils/transfer-form-derivations";

export interface UseTransferFormDerivedOptions {
  wallets: Wallet[];
  values: TransferFormValues;
  editingTransfer?: Transfer | null;
}

export interface TransferFormDerived {
  fromWallet: Wallet | undefined;
  toWallet: Wallet | undefined;
  currency: CurrencyCode;
  availableDestinations: Wallet[];
  availableSourceBalance: number;
  projectedSourceBalance: number;
}

/** Derives the wallet options and balances shown by the transfer form. */
export function useTransferFormDerived({
  wallets,
  values,
  editingTransfer,
}: UseTransferFormDerivedOptions): TransferFormDerived {
  const fromWallet = wallets.find(
    (wallet) => wallet.id === values.fromWalletId,
  );
  const toWallet = wallets.find((wallet) => wallet.id === values.toWalletId);
  const currency = fromWallet?.currency ?? values.currency;

  const availableDestinations = useMemo(
    () => getAvailableDestinations(wallets, values.fromWalletId),
    [wallets, values.fromWalletId],
  );

  const availableSourceBalance = getAvailableSourceBalance(
    fromWallet,
    editingTransfer,
  );

  return {
    fromWallet,
    toWallet,
    currency,
    availableDestinations,
    availableSourceBalance,
    projectedSourceBalance: getProjectedSourceBalance(
      availableSourceBalance,
      values.amount,
    ),
  };
}
