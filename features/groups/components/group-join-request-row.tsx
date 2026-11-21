import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupJoinDecision } from "../hooks/use-group-join-requests";
import { groupJoinStyles as styles } from "../styles/group-join.styles";
import type { GroupJoinRequestItem } from "../types/group-join.types";
import { GroupJoinActionButton } from "./group-join-action-button";

export interface GroupJoinRequestRowProps {
  item: GroupJoinRequestItem;
  /** Request with a decision in flight, if any. */
  pendingId: string | null;
  pendingDecision: GroupJoinDecision | null;
  onRespond: (requestId: string, decision: GroupJoinDecision) => void;
}

/** One pending join request with its single-flight accept and reject actions. */
export function GroupJoinRequestRow({
  item,
  pendingId,
  pendingDecision,
  onRespond,
}: GroupJoinRequestRowProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const { request, requester } = item;
  const name = requester
    ? getFriendDisplayName(requester)
    : t("detail.joinRequestsUnknown");
  const busy = pendingId !== null;
  const accepting = pendingId === request.id && pendingDecision === "accepted";
  const rejecting = pendingId === request.id && pendingDecision === "rejected";
  const busyHint =
    busy && !accepting && !rejecting
      ? t("detail.joinRequestBusyHint")
      : undefined;

  return (
    <View
      style={[
        styles.requestRow,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <View style={styles.requestBody}>
        <ThemedText
          type="defaultSemiBold"
          style={styles.requestName}
          numberOfLines={1}
        >
          {name}
        </ThemedText>
        {requester?.email ? (
          <ThemedText
            style={[styles.requestMeta, { color: theme.muted }]}
            numberOfLines={1}
          >
            {requester.email}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.requestActions}>
        <GroupJoinActionButton
          label={t("detail.joinAccept")}
          accessibilityLabel={t("detail.joinAcceptAccessibility", { name })}
          accessibilityHint={busyHint}
          loading={accepting}
          disabled={busy}
          onPress={() => onRespond(request.id, "accepted")}
        />
        <GroupJoinActionButton
          label={t("detail.joinReject")}
          accessibilityLabel={t("detail.joinRejectAccessibility", { name })}
          accessibilityHint={busyHint}
          variant="danger"
          loading={rejecting}
          disabled={busy}
          onPress={() => onRespond(request.id, "rejected")}
        />
      </View>
    </View>
  );
}
