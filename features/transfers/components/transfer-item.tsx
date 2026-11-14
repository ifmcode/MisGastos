import { useTranslation } from "react-i18next";

import { Wallet } from "@/features/wallets/types/wallet.types";
import { RecordCard } from "@/shared/components/molecules/record-card";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { asTranslate } from "@/shared/i18n/translate";
import { joinMetaParts } from "@/shared/utils/join-meta";

import { Transfer } from "../types/transfer.types";
import {
  EDIT_TRANSFER_HINT_KEY,
  getTransferDetailLabel,
  getTransferEditLabel,
  OPEN_TRANSFER_DETAIL_HINT_KEY,
} from "../utils/transfer-item-accessibility";
import { getTransferWalletNames } from "../utils/transfer-wallet-names";

export interface TransferItemProps {
  transfer: Transfer;
  fromWallet?: Wallet;
  toWallet?: Wallet;
  /** Switches the announced action when the row opens the read-only detail. */
  labelKind?: "edit" | "detail";
  /** Overrides the default hint for the selected label kind. */
  accessibilityHint?: string;
  onPress: () => void;
}

export function TransferItem({
  transfer,
  fromWallet,
  toWallet,
  labelKind = "edit",
  accessibilityHint,
  onPress,
}: TransferItemProps) {
  const { t } = useTranslation("transfers");
  const tr = asTranslate(t);
  const locale = useAppLocale();
  const { fromName, toName } = getTransferWalletNames(
    transfer,
    fromWallet,
    toWallet,
    t("deletedWalletName"),
  );
  const amount = locale.formatCurrency(transfer.amount, transfer.currency);
  const date = locale.formatDate(transfer.date);
  const label =
    labelKind === "detail"
      ? getTransferDetailLabel(transfer, fromName, toName, amount, date)
      : getTransferEditLabel(transfer, fromName, toName, amount, date);
  const hint =
    accessibilityHint ??
    t(
      labelKind === "detail"
        ? OPEN_TRANSFER_DETAIL_HINT_KEY
        : EDIT_TRANSFER_HINT_KEY,
    );

  return (
    <RecordCard
      accessibilityLabel={tr(label.key, label.values)}
      accessibilityHint={hint}
      onPress={onPress}
      icon="swap-horizontal"
      title={`${fromName} → ${toName}`}
      meta={joinMetaParts([date, transfer.notes])}
      amount={amount}
      affordanceIconSize={15}
    />
  );
}
