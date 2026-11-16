import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Friend } from "@/features/friends/types/friend.types";
import { centsToAmount } from "@/features/friends/utils/friend-balance";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";
import type { SharedExpense } from "../types/shared-expense.types";
import { getSharedExpenseParticipantName } from "../utils/shared-expense-friends";
import { SharedExpenseRowActions } from "./shared-expense-row-actions";

export interface SharedExpenseRowProps {
  expense: SharedExpense;
  friends: readonly Friend[];
  viewerUid: string;
  /** Id of the expense with an operation in flight, if any. */
  pendingId: string | null;
  onEdit: (expense: SharedExpense) => void;
  onDelete: (expense: SharedExpense) => void;
}

/**
 * One active expense with its total, payer, the viewer share and the edit and
 * delete actions. Currencies are never converted, so the row keeps its own.
 */
export function SharedExpenseRow({
  expense,
  friends,
  viewerUid,
  pendingId,
  onEdit,
  onDelete,
}: SharedExpenseRowProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t } = useScopedTranslation("sharedExpenses");

  const busy = pendingId !== null;
  const payerName = getSharedExpenseParticipantName(
    friends,
    expense.payerId,
    t("friendFallback"),
  );
  const payerLabel =
    expense.payerId === viewerUid
      ? t("row.youPaid")
      : t("row.friendPaid", { name: payerName });
  const share = expense.participants.find(
    (participant) => participant.userId === viewerUid,
  );
  const shareAmount = share
    ? locale.formatCurrency(centsToAmount(share.shareCents), expense.currency)
    : null;
  const shareLabel =
    shareAmount === null
      ? null
      : share?.percentageBps === undefined
        ? t("row.yourShare", { amount: shareAmount })
        : t("row.yourSharePercent", {
            amount: shareAmount,
            percent: locale.formatPercent(share.percentageBps / 10000, {
              maximumFractionDigits: 2,
            }),
          });

  return (
    <View
      style={[
        styles.rowCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <View style={styles.rowBody}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {expense.description}
        </ThemedText>
        <ThemedText style={[styles.rowMeta, { color: theme.muted }]}>
          {locale.formatDate(expense.date)}
        </ThemedText>
        <ThemedText style={[styles.rowAmount, { color: theme.text }]}>
          {locale.formatCurrency(
            centsToAmount(expense.amountCents),
            expense.currency,
          )}
        </ThemedText>
        <ThemedText style={[styles.rowLine, { color: theme.muted }]}>
          {payerLabel}
        </ThemedText>
        {shareLabel ? (
          <ThemedText style={[styles.rowLine, { color: theme.muted }]}>
            {shareLabel}
          </ThemedText>
        ) : null}
      </View>

      <SharedExpenseRowActions
        description={expense.description}
        disabled={busy}
        deleting={pendingId === expense.id}
        onEdit={() => onEdit(expense)}
        onDelete={() => onDelete(expense)}
      />
    </View>
  );
}
