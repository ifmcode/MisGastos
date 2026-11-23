import type { GroupMember } from "@/features/groups/types/group.types";
import type { GroupExpense } from "@/features/group-expenses/types/group-expense.types";
import { getGroupExpenseRowCopy } from "@/features/group-expenses/utils/group-expense-display";
import { getGroupMemberName } from "@/features/group-expenses/utils/group-expense-members";
import type { GroupTimelineEntry } from "@/features/group-expenses/utils/group-timeline";
import { centsToAmount } from "@/features/friends/utils/friend-balance";
import { TimelineRow } from "@/shared/components/molecules/timeline-row";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { joinMetaParts } from "@/shared/utils/join-meta";

export interface GroupTimelineExpenseRowProps {
  entry: Extract<GroupTimelineEntry, { kind: "expense" }>;
  members: readonly GroupMember[];
  viewerUid: string;
  onOpen: (expense: GroupExpense) => void;
}

/**
 * Group expense row: description, who paid with the total and, only when the
 * viewer still owes a share, that share on the right. The row opens the group
 * expense detail; edit and delete live there.
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
  const meta = joinMetaParts([copy.payerLabel, total]);
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
    locale.formatDate(expense.date),
    expense.description,
    meta,
    shareLabel,
  ]);

  return (
    <TimelineRow
      date={expense.date}
      icon="receipt-outline"
      iconColor={theme.primary}
      iconBackground={theme.primarySoft}
      title={expense.description}
      meta={meta}
      amount={shareLabel}
      amountColor={theme.danger}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t("row.openHint")}
      onPress={() => onOpen(expense)}
    />
  );
}
