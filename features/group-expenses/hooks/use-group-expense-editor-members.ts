import { useCallback, useEffect, useMemo } from "react";

import type { GroupDetail } from "@/features/groups/types/group.types";

import { getGroupMemberIds } from "../utils/group-expense-members";
import { useGroupExpenseMembers } from "./use-group-expense-members";

export interface UseGroupExpenseEditorMembersOptions {
  viewerUid: string | undefined;
  /** Detail already loaded by the entry point; its members skip the read. */
  lockedDetail?: GroupDetail | null;
  /** Group currently selected in the sheet. */
  groupId: string;
  /** Only an open sheet needs the members. */
  enabled: boolean;
}

export interface GroupExpenseEditorMembersState {
  members: GroupDetail["members"];
  memberIds: string[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Members of the group currently selected in the form. The group detail and the
 * expense detail already carry them, so those entry points never pay the read;
 * a group picked in the movements flow loads them once.
 */
export function useGroupExpenseEditorMembers({
  viewerUid,
  lockedDetail,
  groupId,
  enabled,
}: UseGroupExpenseEditorMembersOptions): GroupExpenseEditorMembersState {
  const membersState = useGroupExpenseMembers({ viewerUid });
  const { load, reset } = membersState;

  useEffect(() => {
    if (!enabled) return;
    if (!groupId) {
      reset();
      return;
    }
    if (lockedDetail?.group.id === groupId) return;

    load(groupId);
  }, [enabled, groupId, load, lockedDetail, reset]);

  const lockedGroup =
    lockedDetail && lockedDetail.group.id === groupId ? lockedDetail : null;
  const members = lockedGroup ? lockedGroup.members : membersState.members;
  const memberIds = useMemo(() => getGroupMemberIds(members), [members]);
  const retry = useCallback(() => {
    if (groupId) load(groupId);
  }, [groupId, load]);

  return {
    members,
    memberIds,
    loading: lockedGroup ? false : membersState.loading,
    error: lockedGroup ? null : membersState.error,
    retry,
  };
}
