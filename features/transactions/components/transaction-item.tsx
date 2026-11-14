import { useTranslation } from "react-i18next";

import { Wallet } from "@/features/wallets/types/wallet.types";
import { RecordCard } from "@/shared/components/molecules/record-card";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";
import { joinMetaParts } from "@/shared/utils/join-meta";

import { Transaction } from "../types/transaction.types";
import {
  getTransactionDetailLabel,
  OPEN_TRANSACTION_DETAIL_HINT_KEY,
} from "../utils/transaction-item-accessibility";
import {
  getTransactionCategoryLabel,
  TransactionCategory,
} from "../utils/transaction-options";

export interface TransactionItemProps {
  transaction: Transaction;
  wallet?: Wallet;
  category: TransactionCategory;
  /** Overrides the default detail-view hint when the row opens another screen. */
  accessibilityHint?: string;
  onPress: () => void;
}

export function TransactionItem({
  transaction,
  wallet,
  category,
  accessibilityHint,
  onPress,
}: TransactionItemProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("transactions");
  const tr = asTranslate(t);
  const locale = useAppLocale();
  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? theme.success : theme.danger;
  const amountPrefix = isIncome ? "+" : "-";
  const walletName = wallet?.name ?? transaction.walletName;
  const categoryLabel = getTransactionCategoryLabel(category, tr);
  const amount = locale.formatCurrency(
    transaction.amount,
    transaction.currency,
  );
  const date = locale.formatDate(transaction.date);
  const detailLabel = getTransactionDetailLabel(
    transaction,
    categoryLabel,
    amount,
    date,
    walletName,
  );
  const hint = accessibilityHint ?? t(OPEN_TRANSACTION_DETAIL_HINT_KEY);

  return (
    <RecordCard
      accessibilityLabel={tr(detailLabel.key, {
        ...detailLabel.values,
        type: tr(detailLabel.values.typeKey),
      })}
      accessibilityHint={hint}
      onPress={onPress}
      icon={category.icon}
      title={transaction.concept}
      meta={joinMetaParts([date, categoryLabel, walletName])}
      amount={`${amountPrefix}${amount}`}
      amountColor={amountColor}
      secondaryAmount={transaction.currency}
    />
  );
}
