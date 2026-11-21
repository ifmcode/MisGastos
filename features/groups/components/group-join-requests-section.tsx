import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupJoinDecision } from "../hooks/use-group-join-requests";
import { groupJoinStyles as styles } from "../styles/group-join.styles";
import type { GroupJoinRequestItem } from "../types/group-join.types";
import { GroupJoinRequestRow } from "./group-join-request-row";

export interface GroupJoinRequestsSectionProps {
  requests: readonly GroupJoinRequestItem[];
  pendingId: string | null;
  pendingDecision: GroupJoinDecision | null;
  error: string | null;
  respond: (requestId: string, decision: GroupJoinDecision) => void;
}

/**
 * Owner queue of people who asked to join with the code. The detail already
 * carries only pending requests, so an empty list is the settled state.
 */
export function GroupJoinRequestsSection({
  requests,
  pendingId,
  pendingDecision,
  error,
  respond,
}: GroupJoinRequestsSectionProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const empty = requests.length === 0;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionTitle, { color: theme.muted }]}>
          {t("detail.joinRequestsTitle")}
        </ThemedText>
        <ThemedText style={[styles.sectionCount, { color: theme.muted }]}>
          {t("detail.joinRequestsCount", { count: requests.length })}
        </ThemedText>
      </View>

      <ErrorBanner message={error} />

      {empty ? (
        <ThemedText style={[styles.emptyText, { color: theme.muted }]}>
          {t("detail.joinRequestsEmpty")}
        </ThemedText>
      ) : (
        requests.map((item) => (
          <GroupJoinRequestRow
            key={item.request.id}
            item={item}
            pendingId={pendingId}
            pendingDecision={pendingDecision}
            onRespond={respond}
          />
        ))
      )}
    </View>
  );
}
