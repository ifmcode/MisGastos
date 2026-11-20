import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { FriendActionButton } from "@/features/friends/components/friend-action-button";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupInvitationResponse } from "../hooks/use-group-invitation-actions";
import { groupsStyles as styles } from "../styles/groups.styles";
import type { PendingGroupInvitationItem } from "../types/group.types";

export interface GroupInvitationCardProps {
  item: PendingGroupInvitationItem;
  /** Invitation with an operation in flight, if any. */
  pendingId: string | null;
  pendingAction: GroupInvitationResponse | null;
  onAccept: (invitationId: string) => void;
  onReject: (invitationId: string) => void;
}

/** One received invitation with its single-flight accept and reject actions. */
export function GroupInvitationCard({
  item,
  pendingId,
  pendingAction,
  onAccept,
  onReject,
}: GroupInvitationCardProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const inviterName = item.inviter
    ? getFriendDisplayName(item.inviter)
    : t("invitations.inviterFallback");
  const busy = pendingId !== null;
  const accepting =
    pendingId === item.invitationId && pendingAction === "accept";
  const rejecting =
    pendingId === item.invitationId && pendingAction === "reject";
  const busyHint =
    busy && !accepting && !rejecting
      ? t("invitations.busyHint")
      : undefined;

  return (
    <View
      style={[
        styles.invitationCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <View style={styles.infoBlock}>
        <ThemedText type="defaultSemiBold" numberOfLines={2}>
          {item.groupName}
        </ThemedText>
        <ThemedText style={[styles.rowMeta, { color: theme.muted }]}>
          {t("invitations.invitedBy", { name: inviterName })}
        </ThemedText>
      </View>

      <View style={styles.invitationActions}>
        <FriendActionButton
          label={accepting ? t("invitations.accepting") : t("invitations.accept")}
          accessibilityLabel={t("invitations.acceptAccessibility", {
            group: item.groupName,
          })}
          accessibilityHint={busyHint}
          loading={accepting}
          disabled={busy}
          onPress={() => onAccept(item.invitationId)}
        />
        <FriendActionButton
          label={rejecting ? t("invitations.rejecting") : t("invitations.reject")}
          accessibilityLabel={t("invitations.rejectAccessibility", {
            group: item.groupName,
          })}
          accessibilityHint={busyHint}
          variant="danger"
          loading={rejecting}
          disabled={busy}
          onPress={() => onReject(item.invitationId)}
        />
      </View>
    </View>
  );
}
