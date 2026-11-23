import { useCallback } from "react";
import { RefreshControl, ScrollView } from "react-native";

import { GroupBalancesSection } from "@/features/group-expenses/components/group-balances-section";
import { GroupTimeline } from "@/features/group-expenses/components/group-timeline";
import type { GroupBalancesController } from "@/features/group-expenses/hooks/use-group-balances";
import type { GroupDetailSettlementsController } from "@/features/group-expenses/hooks/use-group-detail-settlements";
import type { GroupExpense } from "@/features/group-expenses/types/group-expense.types";
import type { GroupSettlement } from "@/features/group-expenses/types/group-settlement.types";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import type { GroupDetailExpensesController } from "../hooks/use-group-detail-expenses";
import { groupsStyles as styles } from "../styles/groups.styles";
import type { GroupDetail } from "../types/group.types";
import { GroupDetailHeader } from "./group-detail-header";

export interface GroupDetailContentProps {
  detail: GroupDetail;
  viewerUid: string;
  isOwner: boolean;
  refreshing: boolean;
  error: string | null;
  balances: GroupBalancesController;
  settlements: GroupDetailSettlementsController;
  expenses: GroupDetailExpensesController;
  onRefresh: () => void;
  onBack: () => void;
  onOpenDetails: () => void;
  onInvite: () => void;
  onOpenExpense: (expense: GroupExpense) => void;
  /** Opens the settle route without a pair; the route asks which debt. */
  onOpenSettle: () => void;
  onOpenSettlement: (settlement: GroupSettlement) => void;
}

/** Scrollable body of the group detail: header, balances and one timeline. */
export function GroupDetailContent({
  detail,
  viewerUid,
  isOwner,
  refreshing,
  error,
  balances,
  settlements,
  expenses,
  onRefresh,
  onBack,
  onOpenDetails,
  onInvite,
  onOpenExpense,
  onOpenSettle,
  onOpenSettlement,
}: GroupDetailContentProps) {
  const theme = useFormTheme();
  const settled =
    balances.balances !== null && balances.balances.debts.length === 0;
  const retryTimeline = useCallback(() => {
    expenses.retry();
    settlements.retry();
  }, [expenses, settlements]);

  return (
    <ScrollView
      contentContainerStyle={styles.detailScrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
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

      <GroupTimeline
        expenses={expenses.expenses}
        settlements={settlements.settlements}
        members={detail.members}
        viewerUid={viewerUid}
        loading={expenses.loading || settlements.loading}
        error={expenses.error ?? settlements.error}
        onRetry={retryTimeline}
        onOpenExpense={onOpenExpense}
        onOpenSettlement={onOpenSettlement}
      />
    </ScrollView>
  );
}
