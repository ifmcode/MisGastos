import { useMemo } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { GroupExpense } from "@/features/group-expenses/types/group-expense.types";
import type { GroupSettlement } from "@/features/group-expenses/types/group-settlement.types";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupActivityStyles as styles } from "../styles/group-activity.styles";
import type { GroupActivity } from "../types/group-activity.types";
import type { GroupMember } from "../types/group.types";
import { buildGroupActivityEntries } from "../utils/group-activity-timeline";
import { GroupActivityFooter } from "./group-activity-footer";
import { GroupActivityList } from "./group-activity-list";

export interface GroupActivitySectionProps {
  expenses: readonly GroupExpense[];
  settlements: readonly GroupSettlement[];
  activities: readonly GroupActivity[];
  members: readonly GroupMember[];
  viewerUid: string;
  /** Any of the three sources still resolving its first page. */
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onOpenExpense: (expenseId: string) => void;
  onOpenSettlement: (settlementId: string) => void;
}

/**
 * **Actividad del grupo**: active expenses and settlements as rich rows plus the
 * activity events, ordered by activity time. First load owns the section; a
 * background failure keeps the loaded register and shows the banner.
 */
export function GroupActivitySection({
  expenses,
  settlements,
  activities,
  members,
  viewerUid,
  loading,
  error,
  onRetry,
  hasMore,
  loadingMore,
  onLoadMore,
  onOpenExpense,
  onOpenSettlement,
}: GroupActivitySectionProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation(["groups", "common"]);
  const entries = useMemo(
    () => buildGroupActivityEntries({ expenses, settlements, activities }),
    [activities, expenses, settlements],
  );

  return (
    <View style={styles.section}>
      <ThemedText
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: theme.muted }]}
      >
        {t("history.title")}
      </ThemedText>

      {loading && entries.length === 0 ? (
        <LoadingState variant="inline" message={t("history.loading")} />
      ) : error && entries.length === 0 ? (
        <ErrorState
          variant="inline"
          message={error}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("history.retryAccessibility")}
          onRetry={onRetry}
        />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState
            variant="card"
            title={t("history.emptyTitle")}
            message={t("history.emptyMessage")}
          />
        </View>
      ) : (
        <>
          <ErrorBanner message={error} />
          <GroupActivityList
            entries={entries}
            activities={activities}
            members={members}
            viewerUid={viewerUid}
            onOpenExpense={onOpenExpense}
            onOpenSettlement={onOpenSettlement}
          />
        </>
      )}

      {hasMore ? (
        <GroupActivityFooter loading={loadingMore} onPress={onLoadMore} />
      ) : null}
    </View>
  );
}
