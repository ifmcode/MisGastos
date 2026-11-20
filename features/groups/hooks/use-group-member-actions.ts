import { useCallback, useRef, useState } from "react";

import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import {
  useConfirmDialog,
  type UseConfirmDialogResult,
} from "@/shared/hooks/use-confirm-dialog";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupErrorCode } from "../services/group.errors";
import type {
  GroupInvitationItem,
  GroupMember,
} from "../types/group.types";
import { useGroupsService } from "./use-groups-service";

export interface UseGroupMemberActionsOptions {
  viewerUid: string | undefined;
  groupId: string;
  onChanged: () => void | Promise<void>;
}

export interface GroupMemberActionsController {
  /** uid of the removed member or id of the cancelled invitation. */
  pendingId: string | null;
  error: string | null;
  removeConfirm: UseConfirmDialogResult;
  cancelConfirm: UseConfirmDialogResult;
  requestRemove: (member: GroupMember) => void;
  requestCancelInvitation: (item: GroupInvitationItem) => void;
}

/** Owner moderation of the group: remove a member and cancel an invitation. */
export function useGroupMemberActions({
  viewerUid,
  groupId,
  onChanged,
}: UseGroupMemberActionsOptions): GroupMemberActionsController {
  const service = useGroupsService();
  const { t, tr } = useScopedTranslation("groups");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const removeConfirm = useConfirmDialog();
  const cancelConfirm = useConfirmDialog();
  const inFlightRef = useRef(false);

  const run = useCallback(
    async (
      id: string,
      fallback: "SAVE_FAILED" | "DELETE_FAILED",
      operation: (viewer: string) => Promise<unknown>,
    ) => {
      if (!viewerUid || inFlightRef.current) return;

      inFlightRef.current = true;
      setPendingId(id);
      setError(null);

      try {
        await operation(viewerUid);
        await onChanged();
      } catch (actionError: unknown) {
        setError(tr(`errors.${getGroupErrorCode(actionError, fallback)}`));
      } finally {
        inFlightRef.current = false;
        setPendingId(null);
      }
    },
    [onChanged, tr, viewerUid],
  );

  const requestRemove = useCallback(
    (member: GroupMember) => {
      removeConfirm.open({
        title: t("details.removeDialogTitle"),
        message: t("details.removeDialogMessage", {
          name: getFriendDisplayName(member),
        }),
        confirmLabel: t("details.removeDialogConfirm"),
        cancelLabel: t("details.removeDialogCancel"),
        onConfirm: () => {
          void run(member.uid, "DELETE_FAILED", (viewer) =>
            service.removeMember(viewer, groupId, member.uid),
          );
        },
      });
    },
    [groupId, removeConfirm, run, service, t],
  );

  const requestCancelInvitation = useCallback(
    (item: GroupInvitationItem) => {
      const name = item.invitee
        ? getFriendDisplayName(item.invitee)
        : t("details.unknownInvitee");
      const invitationId = item.invitation.id;

      cancelConfirm.open({
        title: t("details.cancelInvitationDialogTitle"),
        message: t("details.cancelInvitationDialogMessage", { name }),
        confirmLabel: t("details.cancelInvitationDialogConfirm"),
        cancelLabel: t("details.cancelInvitationDialogCancel"),
        onConfirm: () => {
          void run(invitationId, "DELETE_FAILED", (viewer) =>
            service.cancelInvitation(viewer, invitationId),
          );
        },
      });
    },
    [cancelConfirm, run, service, t],
  );

  return {
    pendingId,
    error,
    removeConfirm,
    cancelConfirm,
    requestRemove,
    requestCancelInvitation,
  };
}
