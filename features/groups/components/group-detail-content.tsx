import { useCallback } from "react";
import { ScrollView } from "react-native";

import { GroupBalancesSection } from "@/features/group-expenses/components/group-balances-section";
import type { GroupBalancesController } from "@/features/group-expenses/hooks/use-group-balances";
import type { GroupDetailSettlementsController } from "@/features/group-expenses/hooks/use-group-detail-settlements";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";

import type { GroupActivityFeedController } from "../hooks/use-group-activity-feed";
import type { GroupDetailExpensesController } from "../hooks/use-group-detail-expenses";
import { groupsStyles as styles } from "../styles/groups.styles";
import type { GroupDetail } from "../types/group.types";
import { GroupActivitySection } from "./group-activity-section";
import { GroupDetailHeader } from "./group-detail-header";

export interface GroupDetailContentProps {
  detail: GroupDetail;
  viewerUid: string;
  isOwner: boolean;
  error: string | null;
  balances: GroupBalancesController;
  settlements: GroupDetailSettlementsController;
  expenses: GroupDetailExpensesController;
  activity: GroupActivityFeedController;
  onBack: () => void;
  onOpenDetails: () => void;
  onInvite: () => void;
  onOpenExpense: (expenseId: string) => void;
  /** Opens the settle route without a pair; the route asks which debt. */
  onOpenSettle: () => void;
  onOpenSettlement: (settlementId: string) => void;
}

/**
 * Scrollable body of the group detail: header, balances and the merged activity
 * register of active records plus events.
 */
export function GroupDetailContent({
  detail,
  viewerUid,
  isOwner,
  error,
  balances,
  settlements,
  expenses,
  activity,
  onBack,
  onOpenDetails,
  onInvite,
  onOpenExpense,
  onOpenSettle,
  onOpenSettlement,
}: GroupDetailContentProps) {
  const settled =
    balances.balances !== null && balances.balances.debts.length === 0;
  const retryActivity = useCallback(() => {
    expenses.retry();
    settlements.retry();
    activity.reload();
  }, [activity, expenses, settlements]);

  return (
    <ScrollView
      contentContainerStyle={styles.detailScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ErrorBanner message={error} />

      <GroupDetailHeader
        detail={detail}
        isOwner={isOwner}
        settled={settled}
        onBack={onBack}
        onOpenDetails={onOpenDetails}
        onInvite={onInvite}
      />

      <GroupBalancesSection
        balances={balances.balances}
        members={detail.members}
        viewerUid={viewerUid}
        loading={balances.loading}
        error={balances.error}
        onRetry={balances.reload}
        onOpenSettle={onOpenSettle}
      />

      <GroupActivitySection
        expenses={expenses.expenses}
        settlements={settlements.settlements}
        activities={activity.items}
        members={detail.members}
        viewerUid={viewerUid}
        loading={expenses.loading || settlements.loading || activity.loading}
        error={expenses.error ?? settlements.error ?? activity.error}
        onRetry={retryActivity}
        hasMore={activity.hasMore}
        loadingMore={activity.loadingMore}
        onLoadMore={activity.loadMore}
        onOpenExpense={onOpenExpense}
        onOpenSettlement={onOpenSettlement}
      />
    </ScrollView>
  );
}
