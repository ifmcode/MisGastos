import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Friend } from "@/features/friends/types/friend.types";
import type { Settlement } from "@/features/settlements/types/settlement.types";
import type { SharedExpense } from "@/features/shared-expenses/types/shared-expense.types";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { friendTimelineStyles as styles } from "../styles/friend-timeline.styles";
import type { FriendTimelineEntry } from "../utils/friend-timeline";
import { FriendTimelineList } from "./friend-timeline-list";
import { FriendTimelineSeparator } from "./friend-timeline-separator";
import { FriendTimelineSettledNotice } from "./friend-timeline-settled-notice";
import { FriendTimelineSettledToggle } from "./friend-timeline-settled-toggle";

export interface FriendDetailTimelineProps {
  currentEntries: readonly FriendTimelineEntry[];
  settledEntries: readonly FriendTimelineEntry[];
  friends: readonly Friend[];
  viewerUid: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenExpense: (expense: SharedExpense) => void;
  onOpenSettlement: (settlement: Settlement) => void;
  showSettled: boolean;
  onToggleSettled: () => void;
}

/**
 * Section title plus the pair history split at the settled boundary. The open
 * cycle is always visible; the settled cycle stays hidden until expanded, so a
 * new expense never reopens history that a settlement already closed.
 */
export function FriendDetailTimeline({
  currentEntries,
  settledEntries,
  friends,
  viewerUid,
  loading,
  error,
  onRetry,
  onOpenExpense,
  onOpenSettlement,
  showSettled,
  onToggleSettled,
}: FriendDetailTimelineProps) {
  const theme = useFormTheme();
  const { t } = useTranslation([
    "sharedExpenses",
    "social",
    "common",
    "settlements",
  ]);
  const total = currentEntries.length + settledEntries.length;
  const hasCurrent = currentEntries.length > 0;
  const hasSettled = settledEntries.length > 0;
  const expanded = hasSettled && showSettled;

  function renderList(entries: readonly FriendTimelineEntry[]) {
    return (
      <FriendTimelineList
        entries={entries}
        friends={friends}
        viewerUid={viewerUid}
        onOpenExpense={onOpenExpense}
        onOpenSettlement={onOpenSettlement}
      />
    );
  }

  return (
    <View style={styles.section}>
      <ThemedText
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: theme.muted }]}
      >
        {t("sharedExpenses:title")}
      </ThemedText>

      {loading && total === 0 ? (
        <LoadingState variant="inline" message={t("sharedExpenses:loading")} />
      ) : error && total === 0 ? (
        <ErrorState
          variant="inline"
          message={error}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("sharedExpenses:retryAccessibility")}
          onRetry={onRetry}
        />
      ) : (
        <>
          <ErrorBanner message={error} />
          {total === 0 ? (
            <EmptyState
              variant="card"
              title={t("social:friendDetail.emptyTitle")}
              message={t("social:friendDetail.emptyMessage")}
            />
          ) : null}

          {hasCurrent ? renderList(currentEntries) : null}

          {expanded ? (
            <>
              {hasCurrent ? <FriendTimelineSeparator /> : null}
              {renderList(settledEntries)}
            </>
          ) : null}

          {hasSettled ? (
            <>
              {/* Collapsed and fully settled: the notice explains the empty
                  open cycle. With a current cycle, or once expanded, the rows
                  and the separator speak for themselves. */}
              {!expanded && !hasCurrent ? (
                <FriendTimelineSettledNotice />
              ) : null}
              <FriendTimelineSettledToggle
                expanded={expanded}
                onPress={onToggleSettled}
              />
            </>
          ) : null}
        </>
      )}
    </View>
  );
}
