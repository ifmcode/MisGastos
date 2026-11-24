import type { GroupMember } from "@/features/groups/types/group.types";
import type { GroupActivityEntry } from "@/features/groups/utils/group-activity-timeline";
import { getGroupActivityEntryDate } from "@/features/groups/utils/group-activity-timeline";
import type { GroupExpense } from "@/features/group-expenses/types/group-expense.types";
import { getGroupExpenseRowCopy } from "@/features/group-expenses/utils/group-expense-display";
import { getGroupMemberName } from "@/features/group-expenses/utils/group-expense-members";
import { centsToAmount } from "@/features/friends/utils/friend-balance";
import { TimelineRow } from "@/shared/components/molecules/timeline-row";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { joinMetaParts } from "@/shared/utils/join-meta";

export interface GroupTimelineExpenseRowProps {
  entry: Extract<GroupActivityEntry, { kind: "expense" }>;
  members: readonly GroupMember[];
  viewerUid: string;
  onOpen: (expenseId: string) => void;
}

/**
 * Group expense row: description, who paid with the total and, only when the
 * viewer still owes a share, that share on the right. The gutter shows the
 * activity day; the business date is only added to the meta when it differs.
 */
export function GroupTimelineExpenseRow({
  entry,
  members,
  viewerUid,
  onOpen,
}: GroupTimelineExpenseRowProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t, tr } = useScopedTranslation("groupExpenses");
  const { expense } = entry;

  const payerName = getGroupMemberName(members, expense.payerId, {
    viewerUid,
    viewerLabel: t("viewerName"),
    fallback: t("memberFallback"),
  });
  const copy = getGroupExpenseRowCopy(expense, { viewerUid, payerName, t: tr });
  const total = locale.formatCurrency(
    centsToAmount(expense.amountCents),
    expense.currency,
  );
  const activityDay = getGroupActivityEntryDate(entry.sortAt);
  const businessDate =
    expense.date === activityDay ? undefined : locale.formatDate(expense.date);
  const meta = joinMetaParts([businessDate, copy.payerLabel, total]);
  const shareLabel =
    copy.effect === "charged"
      ? t("row.yourShare", {
          amount: locale.formatCurrency(
            centsToAmount(copy.shareCents),
            expense.currency,
          ),
        })
      : undefined;
  const accessibilityLabel = joinMetaParts([
    locale.formatDate(activityDay),
    expense.description,
    meta,
    shareLabel,
  ]);

  return (
    <TimelineRow
      date={activityDay}
      icon="receipt-outline"
      iconColor={theme.primary}
      iconBackground={theme.primarySoft}
      title={expense.description}
      meta={meta}
      amount={shareLabel}
      amountColor={theme.danger}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t("row.openHint")}
      onPress={() => onOpen(expense.id)}
    />
  );
}
