import { useTranslation } from "react-i18next";

import { centsToAmount } from "@/features/friends/utils/friend-balance";
import type { Friend } from "@/features/friends/types/friend.types";
import type { SharedExpense } from "@/features/shared-expenses/types/shared-expense.types";
import { getSharedExpenseParticipantName } from "@/features/shared-expenses/utils/shared-expense-friends";
import { TimelineRow } from "@/shared/components/molecules/timeline-row";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { joinMetaParts } from "@/shared/utils/join-meta";

import type { FriendTimelineEntry } from "../utils/friend-timeline";
import { getExpenseTimelineEffect } from "../utils/friend-timeline";

export interface FriendTimelineExpenseRowProps {
  entry: Extract<FriendTimelineEntry, { kind: "expense" }>;
  friends: readonly Friend[];
  viewerUid: string;
  onOpen: (expense: SharedExpense) => void;
}

/**
 * Shared expense row: description, who paid with the total, and the viewer
 * effect on the right. The effect comes from the expense ledger, so an equal,
 * percentage, fixed or shares split reads the same as the pair balances.
 */
export function FriendTimelineExpenseRow({
  entry,
  friends,
  viewerUid,
  onOpen,
}: FriendTimelineExpenseRowProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t } = useTranslation("sharedExpenses");
  const { expense } = entry;

  const payerName = getSharedExpenseParticipantName(
    friends,
    expense.payerId,
    t("friendFallback"),
  );
  const payerLabel =
    expense.payerId === viewerUid
      ? t("row.youPaid")
      : t("row.friendPaid", { name: payerName });
  const total = locale.formatCurrency(
    centsToAmount(expense.amountCents),
    expense.currency,
  );
  const meta = joinMetaParts([payerLabel, total]);
  const effect = getExpenseTimelineEffect(expense, viewerUid);
  const effectLabel = effect
    ? t(effect.direction === "lent" ? "row.youLent" : "row.youBorrowed", {
        amount: locale.formatCurrency(
          centsToAmount(effect.amountCents),
          effect.currency,
        ),
      })
    : undefined;
  const effectColor = effect
    ? effect.direction === "lent"
      ? theme.success
      : theme.danger
    : undefined;
  const date = locale.formatDate(expense.date);
  const accessibilityLabel = joinMetaParts([
    date,
    expense.description,
    meta,
    effectLabel,
  ]);

  return (
    <TimelineRow
      date={expense.date}
      icon="receipt-outline"
      iconColor={theme.primary}
      iconBackground={theme.primarySoft}
      title={expense.description}
      meta={meta}
      amount={effectLabel}
      amountColor={effectColor}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t("row.openHint")}
      onPress={() => onOpen(expense)}
    />
  );
}
