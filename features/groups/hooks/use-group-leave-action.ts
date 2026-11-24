import { useCallback } from "react";

import {
  useConfirmDialog,
  type UseConfirmDialogResult,
} from "@/shared/hooks/use-confirm-dialog";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getLeaveDialogCopy } from "../utils/group-membership-copy";
import type { GroupMemberActionsCore } from "./use-group-member-actions.types";
import { useGroupsService } from "./use-groups-service";

export interface UseGroupLeaveActionOptions {
  core: GroupMemberActionsCore;
  viewerUid: string | undefined;
  groupId: string;
  groupName: string;
  /** Leaves the route once the service accepted the departure. */
  onLeft?: () => void;
}

export interface GroupLeaveController {
  leaveConfirm: UseConfirmDialogResult;
  requestLeave: () => void;
}

/**
 * Self-service departure: the owner never reaches it (the sheet shows the
 * transfer-first hint), and an unsettled viewer gets the settle dialog first.
 */
export function useGroupLeaveAction({
  core,
  viewerUid,
  groupId,
  groupName,
  onLeft,
}: UseGroupLeaveActionOptions): GroupLeaveController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const leaveConfirm = useConfirmDialog();
  const { canLeave, checkBlocked, run } = core;

  const requestLeave = useCallback(() => {
    if (!canLeave || !viewerUid) return;
    if (checkBlocked(viewerUid, "viewer")) return;

    leaveConfirm.open({
      ...getLeaveDialogCopy(groupName, tr),
      onConfirm: () => {
        void run(
          viewerUid,
          "leave",
          "DELETE_FAILED",
          (viewer) => service.leaveGroup(viewer, groupId),
          () => onLeft?.(),
        );
      },
    });
  }, [
    canLeave,
    checkBlocked,
    groupId,
    groupName,
    leaveConfirm,
    onLeft,
    run,
    service,
    tr,
    viewerUid,
  ]);

  return { leaveConfirm, requestLeave };
}
