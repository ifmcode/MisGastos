import { View } from "react-native";

import { FriendRequestSection } from "@/features/friends/components/friend-request-section";
import { GroupInvitationsSection } from "@/features/groups/components/group-invitations-section";
import { OwnerJoinRequestsSection } from "@/features/groups/components/owner-join-requests-section";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import {
  hasInboxRequestsContent,
  type InboxRequestsController,
} from "../hooks/use-inbox-requests";
import { notificationsStyles as styles } from "../styles/notifications.styles";
import type { NotificationSegment } from "../types/notification-segment.types";

export interface InboxRequestsBlockProps {
  requests: InboxRequestsController;
  segment: NotificationSegment;
}

/**
 * Actionable queue at the top of Pendientes: owner join requests, received
 * group invitations and friend requests in both directions. Each source keeps
 * its own loading and error state; nothing renders in Vistas or when empty.
 */
export function InboxRequestsBlock({
  requests,
  segment,
}: InboxRequestsBlockProps) {
  const { t } = useScopedTranslation("friends");
  const owner = requests.ownerJoinRequests;

  if (segment !== "pending") return null;
  if (!hasInboxRequestsContent(requests)) return null;

  return (
    <View style={styles.requestsBlock}>
      <OwnerJoinRequestsSection
        items={owner.items}
        loading={owner.loading}
        error={owner.error}
        actionError={owner.actionError}
        pendingId={owner.pendingId}
        pendingDecision={owner.pendingDecision}
        onRespond={owner.respond}
        onRetry={owner.reload}
      />
      <GroupInvitationsSection
        invitations={requests.groupInvitations}
        loading={requests.groupsLoading}
        error={requests.groupError}
        actionError={requests.groupActionError}
        pendingId={requests.groupPendingId}
        pendingAction={requests.groupPendingAction}
        onAccept={requests.acceptInvitation}
        onReject={requests.rejectInvitation}
        onRetry={requests.reloadGroups}
      />
      <FriendRequestSection
        title={t("requests.incomingTitle")}
        requests={requests.incoming}
        pendingId={requests.pendingId}
        onAccept={requests.acceptRequest}
        onReject={requests.rejectRequest}
        onCancel={requests.cancelRequest}
      />
      <FriendRequestSection
        title={t("requests.outgoingTitle")}
        requests={requests.outgoing}
        pendingId={requests.pendingId}
        onAccept={requests.acceptRequest}
        onReject={requests.rejectRequest}
        onCancel={requests.cancelRequest}
      />
    </View>
  );
}
