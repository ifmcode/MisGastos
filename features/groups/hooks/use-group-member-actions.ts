import { useGroupLeaveAction } from "./use-group-leave-action";
import { useGroupMemberActionsCore } from "./use-group-member-actions-core";
import type {
  GroupMemberActionsController,
  GroupMemberPendingAction,
  UseGroupMemberActionsOptions,
} from "./use-group-member-actions.types";
import { useGroupMemberModeration } from "./use-group-member-moderation";

export type {
  GroupMemberActionsController,
  GroupMemberPendingAction,
  UseGroupMemberActionsOptions,
} from "./use-group-member-actions.types";

/**
 * Facade of the membership actions of one group. The in-flight state and the
 * balance guard live in the core, while the moderation (remove, cancel, transfer)
 * and the self-service leave keep their own dialogs.
 */
export function useGroupMemberActions({
  viewerUid,
  groupId,
  groupName,
  isOwner,
  balances,
  onChanged,
  onLeft,
  onOpenSettle,
}: UseGroupMemberActionsOptions): GroupMemberActionsController {
  const core = useGroupMemberActionsCore({
    viewerUid,
    isOwner,
    balances,
    onOpenSettle,
  });
  const moderation = useGroupMemberModeration({
    core,
    groupId,
    isOwner,
    onChanged,
  });
  const leave = useGroupLeaveAction({
    core,
    viewerUid,
    groupId,
    groupName,
    onLeft,
  });

  return {
    pendingId: core.pendingId,
    pendingAction: core.pendingAction,
    error: core.error,
    blockedDialog: core.blockedDialog,
    canLeave: core.canLeave,
    removeConfirm: moderation.removeConfirm,
    cancelConfirm: moderation.cancelConfirm,
    transferConfirm: moderation.transferConfirm,
    leaveConfirm: leave.leaveConfirm,
    requestRemove: moderation.requestRemove,
    requestCancelInvitation: moderation.requestCancelInvitation,
    requestTransfer: moderation.requestTransfer,
    requestLeave: leave.requestLeave,
  };
}
