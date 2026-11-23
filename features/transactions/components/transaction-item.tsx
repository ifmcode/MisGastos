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

/**
 * Movement row. A linked movement shows the "Compartido" pill and announces the
 * shared-expense detail, because its personal edit/delete path does not exist.
 */
export function TransactionItem({
  transaction,
  wallet,
  category,
  accessibilityHint,
  onPress,
}: TransactionItemProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("transactions");
  const { t: tShared } = useTranslation("sharedExpenses");
  const { t: tGroup } = useTranslation("groupExpenses");
  const { t: tSettlements } = useTranslation("settlements");
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
  // A group settlement income is a settlement too: it keeps the settlements
  // badge and hint, ahead of the shared-expense and group-expense links.
  const isSettlement = Boolean(
    transaction.settlementId || transaction.groupSettlementId,
  );
  const settlementLabel = isSettlement ? tSettlements("badge.label") : undefined;
  const detailLabel = getTransactionDetailLabel(
    transaction,
    categoryLabel,
    amount,
    date,
    walletName,
    settlementLabel,
  );
  const isLinked = Boolean(transaction.sharedExpenseId);
  const isGroupLinked = Boolean(transaction.groupExpenseId);
  // The group link is exclusive of the 1:1 one; settlements keep their priority.
  const linkedBadge = isLinked
    ? tShared("badge.label")
    : isGroupLinked
      ? tGroup("badge.label")
      : undefined;
  const linkedHint = isLinked
    ? tShared("badge.hint")
    : isGroupLinked
      ? tGroup("badge.hint")
      : null;
  const badge = settlementLabel ?? linkedBadge;
  const hint =
    accessibilityHint ??
    (isSettlement
      ? tSettlements("badge.hint")
      : linkedHint ?? t(OPEN_TRANSACTION_DETAIL_HINT_KEY));
  const summary = tr(detailLabel.key, {
    ...detailLabel.values,
    type: tr(detailLabel.values.typeKey),
  });

  return (
    <RecordCard
      accessibilityLabel={badge ? `${badge} · ${summary}` : summary}
      accessibilityHint={hint}
      onPress={onPress}
      icon={category.icon}
      title={settlementLabel ?? transaction.concept}
      meta={joinMetaParts([date, categoryLabel, walletName])}
      amount={`${amountPrefix}${amount}`}
      badge={badge}
      amountColor={amountColor}
      secondaryAmount={transaction.currency}
    />
  );
}
