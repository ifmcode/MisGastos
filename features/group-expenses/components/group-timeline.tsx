import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { GroupMember } from "@/features/groups/types/group.types";
import type { GroupExpense } from "@/features/group-expenses/types/group-expense.types";
import type { GroupSettlement } from "@/features/group-expenses/types/group-settlement.types";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";
import { buildGroupTimeline } from "../utils/group-timeline";
import { GroupTimelineExpenseRow } from "./group-timeline-expense-row";
import { GroupTimelineSettlementRow } from "./group-timeline-settlement-row";

export interface GroupTimelineProps {
  expenses: readonly GroupExpense[];
  settlements: readonly GroupSettlement[];
  members: readonly GroupMember[];
  viewerUid: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** The row only navigates; edit and delete live in the expense detail. */
  onOpenExpense: (expense: GroupExpense) => void;
  onOpenSettlement: (settlement: GroupSettlement) => void;
}

/**
 * One linear history of the group: active expenses and settlements interleaved
 * newest first, each row keeping its own destination. First load owns the
 * section; a background failure keeps the last history and shows the banner.
 */
export function GroupTimeline({
  expenses,
  settlements,
  members,
  viewerUid,
  loading,
  error,
  onRetry,
  onOpenExpense,
  onOpenSettlement,
}: GroupTimelineProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groupExpenses");
  const { t: common } = useTranslation("common");
  const entries = useMemo(
    () => buildGroupTimeline({ expenses, settlements }),
    [expenses, settlements],
  );

  return (
    <View style={styles.section}>
      <ThemedText
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: theme.muted }]}
      >
        {t("sectionTitle")}
      </ThemedText>

      {loading && entries.length === 0 ? (
        <LoadingState variant="inline" message={t("loading")} />
      ) : error && entries.length === 0 ? (
        <ErrorState
          variant="inline"
          message={error}
          retryLabel={common("actions.retry")}
          retryAccessibilityLabel={t("retryAccessibility")}
          onRetry={onRetry}
        />
      ) : entries.length === 0 ? (
        <EmptyState
          variant="card"
          title={t("emptyTitle")}
          message={t("emptyMessage")}
        />
      ) : (
        <>
          <ErrorBanner message={error} />
          <View style={styles.timelineList}>
            {entries.map((entry) =>
              entry.kind === "expense" ? (
                <GroupTimelineExpenseRow
                  key={entry.key}
                  entry={entry}
                  members={members}
                  viewerUid={viewerUid}
                  onOpen={onOpenExpense}
                />
              ) : (
                <GroupTimelineSettlementRow
                  key={entry.key}
                  entry={entry}
                  members={members}
                  viewerUid={viewerUid}
                  onOpen={onOpenSettlement}
                />
              ),
            )}
          </View>
        </>
      )}
    </View>
  );
}
