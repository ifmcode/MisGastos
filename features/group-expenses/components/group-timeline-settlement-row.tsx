import type { GroupMember } from "@/features/groups/types/group.types";
import type { GroupActivityEntry } from "@/features/groups/utils/group-activity-timeline";
import { getGroupActivityEntryDate } from "@/features/groups/utils/group-activity-timeline";
import type { GroupSettlement } from "@/features/group-expenses/types/group-settlement.types";
import { getGroupMemberName } from "@/features/group-expenses/utils/group-expense-members";
import { centsToAmount } from "@/features/friends/utils/friend-balance";
import { TimelineRow } from "@/shared/components/molecules/timeline-row";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { joinMetaParts } from "@/shared/utils/join-meta";

export interface GroupTimelineSettlementRowProps {
  entry: Extract<GroupActivityEntry, { kind: "settlement" }>;
  members: readonly GroupMember[];
  viewerUid: string;
  onOpen: (settlementId: string) => void;
}

/**
 * Group settlement row: the payment sentence as the title, read from the
 * viewer's role, and the note (or the currency) as the meta. The gutter shows
 * the activity day; the business date is only added when it differs.
 */
export function GroupTimelineSettlementRow({
  entry,
  members,
  viewerUid,
  onOpen,
}: GroupTimelineSettlementRowProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t } = useScopedTranslation("groupExpenses");
  const { settlement } = entry;

  const nameOptions = {
    viewerUid,
    viewerLabel: t("viewerName"),
    fallback: t("memberFallback"),
  };
  const from = getGroupMemberName(members, settlement.fromUserId, nameOptions);
  const to = getGroupMemberName(members, settlement.toUserId, nameOptions);
  const amount = locale.formatCurrency(
    centsToAmount(settlement.amountCents),
    settlement.currency,
  );
  const title =
    settlement.fromUserId === viewerUid
      ? t("timeline.youPaidTo", { amount, name: to })
      : settlement.toUserId === viewerUid
        ? t("timeline.paidYou", { amount, name: from })
        : t("timeline.memberPaid", { from, to, amount });
  const note = settlement.note.trim();
  const activityDay = getGroupActivityEntryDate(entry.sortAt);
  const businessDate =
    settlement.date === activityDay
      ? undefined
      : locale.formatDate(settlement.date);
  const meta = joinMetaParts([
    businessDate,
    note.length > 0 ? note : settlement.currency,
  ]);
  const accessibilityLabel = joinMetaParts([
    locale.formatDate(activityDay),
    title,
    meta,
  ]);

  return (
    <TimelineRow
      date={activityDay}
      icon="cash-outline"
      iconColor={theme.success}
      iconBackground={theme.successSurface}
      title={title}
      meta={meta}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t("timeline.openSettlementHint")}
      onPress={() => onOpen(settlement.id)}
    />
  );
}
