import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { GroupJoinActionButton } from "@/features/groups/components/group-join-action-button";
import type { GroupJoinDecision } from "@/features/groups/hooks/use-owner-join-requests";
import type { OwnerJoinRequestItem } from "@/features/groups/types/group-join.types";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { ownerJoinRequestsStyles as styles } from "../styles/owner-join-requests.styles";

export interface OwnerJoinRequestRowProps {
  entry: OwnerJoinRequestItem;
  /** Request with a decision in flight, if any. */
  pendingId: string | null;
  pendingDecision: GroupJoinDecision | null;
  onRespond: (
    groupId: string,
    requestId: string,
    decision: GroupJoinDecision,
  ) => void;
}

/** One pending request with the group it targets and its single-flight actions. */
export function OwnerJoinRequestRow({
  entry,
  pendingId,
  pendingDecision,
  onRespond,
}: OwnerJoinRequestRowProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("social");
  const { formatDate } = useAppLocale();
  const { request, requester } = entry.item;
  const name = requester
    ? getFriendDisplayName(requester)
    : t("ownerJoinRequests.unknownRequester");
  const busy = pendingId !== null;
  const accepting = pendingId === request.id && pendingDecision === "accepted";
  const rejecting = pendingId === request.id && pendingDecision === "rejected";
  const busyHint =
    busy && !accepting && !rejecting
      ? t("ownerJoinRequests.busyHint")
      : undefined;

  return (
    <View
      style={[
        styles.row,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={t("ownerJoinRequests.rowAccessibility", {
          name,
          group: entry.groupName,
        })}
        style={styles.rowBody}
      >
        <ThemedText
          type="defaultSemiBold"
          style={styles.groupName}
          numberOfLines={1}
        >
          {entry.groupName}
        </ThemedText>
        <ThemedText style={styles.requesterName} numberOfLines={1}>
          {name}
        </ThemedText>
        {requester?.email ? (
          <ThemedText
            style={[styles.meta, { color: theme.muted }]}
            numberOfLines={1}
          >
            {requester.email}
          </ThemedText>
        ) : null}
        <ThemedText style={[styles.meta, { color: theme.muted }]}>
          {t("ownerJoinRequests.requestedOn", {
            date: formatDate(request.createdAt.slice(0, 10)),
          })}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <GroupJoinActionButton
          label={t("ownerJoinRequests.accept")}
          accessibilityLabel={t("ownerJoinRequests.acceptAccessibility", {
            name,
            group: entry.groupName,
          })}
          accessibilityHint={busyHint}
          loading={accepting}
          disabled={busy}
          onPress={() => onRespond(entry.groupId, request.id, "accepted")}
        />
        <GroupJoinActionButton
          label={t("ownerJoinRequests.reject")}
          accessibilityLabel={t("ownerJoinRequests.rejectAccessibility", {
            name,
            group: entry.groupName,
          })}
          accessibilityHint={busyHint}
          variant="danger"
          loading={rejecting}
          disabled={busy}
          onPress={() => onRespond(entry.groupId, request.id, "rejected")}
        />
      </View>
    </View>
  );
}
