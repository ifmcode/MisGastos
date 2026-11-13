import { useTranslation } from "react-i18next";

import { Wallet } from "@/features/wallets/types/wallet.types";
import { DetailModal } from "@/shared/components/organisms/detail-modal";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { asTranslate } from "@/shared/i18n/translate";

import { Transfer } from "../types/transfer.types";
import { getDeleteTransferConfirmation } from "../utils/transfer-delete-dialog";
import {
  buildTransferDetailFields,
  getTransferDetailSubtitle,
  getTransferDetailSummary,
} from "../utils/transfer-detail";
import { TransferFormErrorBanner } from "./transfer-form-error-banner";

export interface TransferDetailModalProps {
  visible: boolean;
  transfer: Transfer | null;
  wallets: readonly Wallet[];
  mutating: boolean;
  error: string | null;
  onEdit: (transfer: Transfer) => void;
  onDelete: (transferId: string) => Promise<boolean>;
  onClose: () => void;
}

export function TransferDetailModal({
  visible,
  transfer,
  wallets,
  mutating,
  error,
  onEdit,
  onDelete,
  onClose,
}: TransferDetailModalProps) {
  const { t } = useTranslation(["transfers", "common"]);
  const tr = asTranslate(t);
  const locale = useAppLocale();
  const confirmation = transfer
    ? getDeleteTransferConfirmation(
        transfer,
        wallets,
        locale.formatCurrency(transfer.amount, transfer.currency),
        t("deleteDialog.fallbackWallet"),
        t("deleteDialog.fallbackDeletedWallet"),
        {
          bothOrphaned: t("deleteDialog.bothOrphaned"),
          oneOrphaned: t("deleteDialog.oneOrphaned"),
          noneOrphaned: t("deleteDialog.noneOrphaned"),
        },
      )
    : null;
  const deleteConfirmation = confirmation
    ? {
        title: tr(confirmation.titleKey),
        message: tr(confirmation.messageKey, confirmation.values),
      }
    : null;

  return (
    <DetailModal
      visible={visible}
      title={t("detail.title")}
      subtitle={
        transfer ? getTransferDetailSubtitle(transfer, wallets, tr) : ""
      }
      summary={
        transfer
          ? getTransferDetailSummary(
              transfer,
              locale.formatCurrency,
              tr,
            )
          : undefined
      }
      fields={
        transfer
          ? buildTransferDetailFields(
              transfer,
              wallets,
              tr,
              locale.formatDate,
            )
          : []
      }
      missing={!transfer}
      disabled={mutating}
      labels={{
        close: t("common:accessibility.closeDetail"),
        edit: t("detail.edit"),
        editHint: t("detail.editHint"),
        delete: t("detail.delete"),
        deleteHint: t("detail.deleteHint"),
      }}
      missingLabels={{
        title: t("detail.missingTitle"),
        message: t("detail.missingMessage"),
        close: t("detail.closeButton"),
        closeAccessibilityLabel: t("common:accessibility.closeDetail"),
      }}
      errorContent={
        error ? <TransferFormErrorBanner message={error} /> : undefined
      }
      deleteConfirmation={deleteConfirmation}
      onEdit={() => {
        if (transfer) onEdit(transfer);
      }}
      onConfirmDelete={() =>
        transfer ? onDelete(transfer.id) : Promise.resolve(false)
      }
      onClose={onClose}
    />
  );
}
