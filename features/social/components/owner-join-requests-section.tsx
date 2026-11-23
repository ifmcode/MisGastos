import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { GroupJoinDecision } from "@/features/groups/hooks/use-owner-join-requests";
import type { OwnerJoinRequestItem } from "@/features/groups/types/group-join.types";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { ownerJoinRequestsStyles as styles } from "../styles/owner-join-requests.styles";
import { OwnerJoinRequestRow } from "./owner-join-request-row";

export interface OwnerJoinRequestsSectionProps {
  items: readonly OwnerJoinRequestItem[];
  loading: boolean;
  error: string | null;
  actionError: string | null;
  pendingId: string | null;
  pendingDecision: GroupJoinDecision | null;
  onRespond: (
    groupId: string,
    requestId: string,
    decision: GroupJoinDecision,
  ) => void;
  onRetry: () => void;
}

/**
 * Owner-only queue of `/social/requests`: every pending join request of every
 * group the viewer owns. It owns its inline loading and no-data error states,
 * and it renders nothing when the owner has no pending request at all.
 */
export function OwnerJoinRequestsSection({
  items,
  loading,
  error,
  actionError,
  pendingId,
  pendingDecision,
  onRespond,
  onRetry,
}: OwnerJoinRequestsSectionProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["social", "common"]);
  const empty = items.length === 0;

  if (empty && !loading && !error && !actionError) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionTitle, { color: theme.muted }]}>
          {t("ownerJoinRequests.title")}
        </ThemedText>
        {empty ? null : (
          <ThemedText style={[styles.sectionCount, { color: theme.muted }]}>
            {t("ownerJoinRequests.count", { count: items.length })}
          </ThemedText>
        )}
      </View>

      {empty && loading ? (
        <LoadingState variant="inline" message={t("ownerJoinRequests.loading")} />
      ) : null}

      {empty && error ? (
        <ErrorState
          variant="inline"
          message={error}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("ownerJoinRequests.retryAccessibility")}
          onRetry={onRetry}
        />
      ) : null}

      {!empty && error ? <ErrorBanner message={error} /> : null}
      <ErrorBanner message={actionError} />

      {items.map((entry) => (
        <OwnerJoinRequestRow
          key={`${entry.groupId}:${entry.item.request.id}`}
          entry={entry}
          pendingId={pendingId}
          pendingDecision={pendingDecision}
          onRespond={onRespond}
        />
      ))}
    </View>
  );
}
