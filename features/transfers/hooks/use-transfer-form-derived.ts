import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { CurrencyCode } from "@/shared/constants/currencies";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { asTranslate } from "@/shared/i18n/translate";

import { Transfer, TransferFormValues } from "../types/transfer.types";
import {
  getAvailableDestinations,
  getAvailableSourceBalance,
  getProjectedSourceBalance,
  getTransferAmountHelper,
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
  amountHelper: string | undefined;
}

/** Derives the wallet options and balances shown by the transfer form. */
export function useTransferFormDerived({
  wallets,
  values,
  editingTransfer,
}: UseTransferFormDerivedOptions): TransferFormDerived {
  const { t } = useTranslation("transfers");
  const locale = useAppLocale();
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

  const projectedSourceBalance = getProjectedSourceBalance(
    availableSourceBalance,
    values.amount,
  );

  return {
    fromWallet,
    toWallet,
    currency,
    availableDestinations,
    availableSourceBalance,
    projectedSourceBalance,
    amountHelper: fromWallet
      ? getTransferAmountHelper(
          availableSourceBalance,
          projectedSourceBalance,
          currency,
          locale.formatCurrency,
          asTranslate(t),
        )
      : undefined,
  };
}
