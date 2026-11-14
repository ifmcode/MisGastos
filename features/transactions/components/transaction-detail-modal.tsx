import { useTranslation } from "react-i18next";

import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { DetailModal } from "@/shared/components/organisms/detail-modal";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { asTranslate } from "@/shared/i18n/translate";

import { Transaction } from "../types/transaction.types";
import { getDeleteTransactionConfirmation } from "../utils/transaction-delete-dialog";
import {
  buildTransactionDetailFields,
  getTransactionDetailSummary,
} from "../utils/transaction-detail";

export interface TransactionDetailModalProps {
  visible: boolean;
  transaction: Transaction | null;
  wallets: readonly Wallet[];
  categories: readonly Category[];
  mutating: boolean;
  error: string | null;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => Promise<boolean>;
  onClose: () => void;
}

export function TransactionDetailModal({
  visible,
  transaction,
  wallets,
  categories,
  mutating,
  error,
  onEdit,
  onDelete,
  onClose,
}: TransactionDetailModalProps) {
  const { t } = useTranslation(["transactions", "common"]);
  const tr = asTranslate(t);
  const locale = useAppLocale();
  const confirmation = transaction
    ? getDeleteTransactionConfirmation(
        transaction,
        wallets,
        locale.formatCurrency(transaction.amount, transaction.currency),
      )
    : null;
  const deleteConfirmation = confirmation
    ? {
        title: tr(confirmation.titleKey),
        message: tr(confirmation.messageKey, confirmation.values),
      }
    : null;
  const summary = transaction
    ? getTransactionDetailSummary(
        transaction,
        locale.formatCurrency,
        tr,
      )
    : undefined;
  const fields = transaction
    ? buildTransactionDetailFields(
        transaction,
        wallets,
        categories,
        tr,
        locale.formatDate,
      )
    : [];

  return (
    <DetailModal
      visible={visible}
      title={t("detail.title")}
      subtitle={transaction?.concept ?? ""}
      summary={summary}
      fields={fields}
      missing={!transaction}
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
      errorContent={<ErrorBanner message={error} />}
      deleteConfirmation={deleteConfirmation}
      onEdit={() => {
        if (transaction) onEdit(transaction);
      }}
      onConfirmDelete={() =>
        transaction ? onDelete(transaction.id) : Promise.resolve(false)
      }
      onClose={onClose}
    />
  );
}
