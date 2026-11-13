import { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Translate } from "@/shared/i18n/translate";
import type { DetailField, DetailSummary } from "@/shared/types/detail.types";

import { Transfer } from "../types/transfer.types";
import {
  DELETED_TRANSFER_WALLET_NAME_KEY,
  getTransferWalletNames,
} from "./transfer-wallet-names";

function resolveTransferDetailWalletNames(
  transfer: Transfer,
  wallets: readonly Wallet[],
  t: Translate,
): { fromName: string; toName: string } {
  return getTransferWalletNames(
    transfer,
    wallets.find((wallet) => wallet.id === transfer.fromWalletId),
    wallets.find((wallet) => wallet.id === transfer.toWalletId),
    t(DELETED_TRANSFER_WALLET_NAME_KEY),
  );
}

/** Transfer summary: no income/expense sign, neutral tone. */
export function getTransferDetailSummary(
  transfer: Transfer,
  formatCurrency: (value: number, currency: CurrencyCode) => string,
  t: Translate,
): DetailSummary {
  return {
    label: t("detail.summaryLabel"),
    amount: formatCurrency(transfer.amount, transfer.currency),
    meta: transfer.currency,
    tone: "neutral",
  };
}

export function getTransferDetailSubtitle(
  transfer: Transfer,
  wallets: readonly Wallet[],
  t: Translate,
): string {
  const { fromName, toName } = resolveTransferDetailWalletNames(
    transfer,
    wallets,
    t,
  );

  return `${fromName} → ${toName}`;
}

/**
 * Archived wallets keep their live name and deleted wallets keep the stored
 * `[Eliminada]` label, because `getTransferWalletNames` prefers the live wallet
 * and only falls back to the stored name when it is gone.
 */
export function buildTransferDetailFields(
  transfer: Transfer,
  wallets: readonly Wallet[],
  t: Translate,
  formatDate: (isoDate: string) => string,
): DetailField[] {
  const { fromName, toName } = resolveTransferDetailWalletNames(
    transfer,
    wallets,
    t,
  );

  return [
    { key: "from", label: t("detail.from"), value: fromName },
    { key: "to", label: t("detail.to"), value: toName },
    { key: "date", label: t("detail.date"), value: formatDate(transfer.date) },
    {
      key: "notes",
      label: t("detail.notes"),
      value: transfer.notes?.trim() || t("common:states.noNotes"),
    },
  ];
}
