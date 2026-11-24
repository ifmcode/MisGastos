import { useCallback } from "react";

import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import {
  useConfirmDialog,
  type UseConfirmDialogResult,
} from "@/shared/hooks/use-confirm-dialog";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupInvitationItem, GroupMember } from "../types/group.types";
import {
  getCancelInvitationDialogCopy,
  getRemoveDialogCopy,
  getTransferDialogCopy,
} from "../utils/group-membership-copy";
import type { GroupMemberActionsCore } from "./use-group-member-actions.types";
import { useGroupsService } from "./use-groups-service";

export interface UseGroupMemberModerationOptions {
  core: GroupMemberActionsCore;
  groupId: string;
  isOwner: boolean;
  onChanged: () => void | Promise<void>;
}

export interface GroupMemberModerationController {
  removeConfirm: UseConfirmDialogResult;
  cancelConfirm: UseConfirmDialogResult;
  transferConfirm: UseConfirmDialogResult;
  requestRemove: (member: GroupMember) => void;
  requestCancelInvitation: (item: GroupInvitationItem) => void;
  /** Owner-only: promotes an active member and keeps the old owner inside. */
  requestTransfer: (member: GroupMember) => void;
}

/**
 * Owner moderation of one group. Remove and transfer never block the owner
 * target in the UI: the sheet hides those actions, the service is the guard.
 */
export function useGroupMemberModeration({
  core,
  groupId,
  isOwner,
  onChanged,
}: UseGroupMemberModerationOptions): GroupMemberModerationController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const removeConfirm = useConfirmDialog();
  const cancelConfirm = useConfirmDialog();
  const transferConfirm = useConfirmDialog();
  const { checkBlocked, run } = core;

  const requestRemove = useCallback(
    (member: GroupMember) => {
      const name = getFriendDisplayName(member);
      if (checkBlocked(member.uid, "member", name)) return;

      removeConfirm.open({
        ...getRemoveDialogCopy(name, tr),
        onConfirm: () => {
          void run(
            member.uid,
            "remove",
            "DELETE_FAILED",
            (viewer) => service.removeMember(viewer, groupId, member.uid),
            onChanged,
          );
        },
      });
    },
    [checkBlocked, groupId, onChanged, removeConfirm, run, service, tr],
  );

  const requestCancelInvitation = useCallback(
    (item: GroupInvitationItem) => {
      const name = item.invitee
        ? getFriendDisplayName(item.invitee)
        : tr("details.unknownInvitee");
      const invitationId = item.invitation.id;

      cancelConfirm.open({
        ...getCancelInvitationDialogCopy(name, tr),
        onConfirm: () => {
          void run(
            invitationId,
            "cancel-invitation",
            "DELETE_FAILED",
            (viewer) => service.cancelInvitation(viewer, invitationId),
            onChanged,
          );
        },
      });
    },
    [cancelConfirm, onChanged, run, service, tr],
  );

  const requestTransfer = useCallback(
    (member: GroupMember) => {
      if (!isOwner || member.role === "owner") return;

      transferConfirm.open({
        ...getTransferDialogCopy(getFriendDisplayName(member), tr),
        onConfirm: () => {
          void run(
            member.uid,
            "transfer",
            "SAVE_FAILED",
            (viewer) => service.transferOwnership(viewer, groupId, member.uid),
            onChanged,
          );
        },
      });
    },
    [groupId, isOwner, onChanged, run, service, transferConfirm, tr],
  );

  return {
    removeConfirm,
    cancelConfirm,
    transferConfirm,
    requestRemove,
    requestCancelInvitation,
    requestTransfer,
  };
}
