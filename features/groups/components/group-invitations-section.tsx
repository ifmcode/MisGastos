import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import type { GroupInvitationResponse } from "../hooks/use-group-invitation-actions";
import { groupsStyles as styles } from "../styles/groups.styles";
import type { PendingGroupInvitationItem } from "../types/group.types";
import { GroupInvitationCard } from "./group-invitation-card";

export interface GroupInvitationsSectionProps {
  invitations: readonly PendingGroupInvitationItem[];
  loading: boolean;
  error: string | null;
  actionError: string | null;
  pendingId: string | null;
  pendingAction: GroupInvitationResponse | null;
  onAccept: (invitationId: string) => void;
  onReject: (invitationId: string) => void;
  onRetry: () => void;
}

/**
 * Received group invitations inside `/social/requests`. It owns its inline
 * loading and no-data error states; cached rows survive a background failure.
 */
export function GroupInvitationsSection({
  invitations,
  loading,
  error,
  actionError,
  pendingId,
  pendingAction,
  onAccept,
  onReject,
  onRetry,
}: GroupInvitationsSectionProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["groups", "common"]);
  const empty = invitations.length === 0;

  if (empty && !loading && !error && !actionError) return null;

  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: theme.muted }]}>
        {t("invitations.title")}
      </ThemedText>

      {empty && loading ? (
        <LoadingState variant="inline" message={t("invitations.loading")} />
      ) : null}

      {empty && error ? (
        <ErrorState
          variant="inline"
          message={error}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("invitations.retryAccessibility")}
          onRetry={onRetry}
        />
      ) : null}

      {!empty && error ? <ErrorBanner message={error} /> : null}
      <ErrorBanner message={actionError} />

      {invitations.map((item) => (
        <GroupInvitationCard
          key={item.invitationId}
          item={item}
          pendingId={pendingId}
          pendingAction={pendingAction}
          onAccept={onAccept}
          onReject={onReject}
        />
      ))}
    </View>
  );
}
