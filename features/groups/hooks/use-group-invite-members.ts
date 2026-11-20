import { useCallback, useMemo, useState } from "react";

import type { Friend } from "@/features/friends/types/friend.types";

import type { GroupDetail } from "../types/group.types";
import { countPendingInvitations } from "../utils/group-list";
import {
  getGroupInviteCapacity,
  getGroupInviteePool,
} from "../utils/group-invite-eligibility";
import { useGroupInviteSubmit } from "./use-group-invite-submit";

export interface UseGroupInviteMembersOptions {
  viewerUid: string | undefined;
  detail: GroupDetail | null;
  /** Accepted friends of the viewer. */
  friends: readonly Friend[];
  friendsLoading: boolean;
  friendsError: string | null;
  /** Reloads the friends overview from inside the invite sheet. */
  retryFriends: () => void | Promise<void>;
  onInvited: () => void;
}

export interface GroupInviteMembersController {
  visible: boolean;
  /** Accepted friends who are neither members nor already invited. */
  eligibleFriends: Friend[];
  selectedIds: string[];
  /** Remaining seats: 20 members including the owner. */
  capacity: number;
  friendsLoading: boolean;
  friendsError: string | null;
  retryFriends: () => void;
  submitting: boolean;
  error: string | null;
  open: () => void;
  close: () => void;
  toggle: (uid: string) => void;
  submit: () => void;
}

/** Owner invite round of the group detail: eligibility, capacity and submit. */
export function useGroupInviteMembers({
  viewerUid,
  detail,
  friends,
  friendsLoading,
  friendsError,
  retryFriends: reloadFriends,
  onInvited,
}: UseGroupInviteMembersOptions): GroupInviteMembersController {
  const [visible, setVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const memberIds = detail?.group.memberIds ?? [];
  const invitations = detail?.invitations ?? [];
  // Pending invitations hold a seat: the capacity must reserve them.
  const pendingCount = countPendingInvitations(
    invitations.map((item) => item.invitation),
  );

  const eligibleFriends = useMemo(
    () =>
      getGroupInviteePool(friends, {
        viewerUid: viewerUid ?? "",
        memberIds,
        invitations,
      }),
    [friends, invitations, memberIds, viewerUid],
  );
  const capacity = getGroupInviteCapacity(memberIds, pendingCount);

  const onSent = useCallback(() => {
    setVisible(false);
    setSelectedIds([]);
    onInvited();
  }, [onInvited]);

  const submitState = useGroupInviteSubmit({
    viewerUid,
    groupId: detail?.group.id ?? "",
    selectedIds,
    capacity,
    onSent,
  });
  const { resetError } = submitState;

  const retryFriends = useCallback(() => {
    void reloadFriends();
  }, [reloadFriends]);

  const open = useCallback(() => {
    setSelectedIds([]);
    resetError();
    setVisible(true);
  }, [resetError]);

  const close = useCallback(() => {
    if (submitState.submitting) return;

    setVisible(false);
    setSelectedIds([]);
  }, [submitState.submitting]);

  const toggle = useCallback((uid: string) => {
    setSelectedIds((current) =>
      current.includes(uid)
        ? current.filter((value) => value !== uid)
        : [...current, uid],
    );
  }, []);

  return {
    visible,
    eligibleFriends,
    selectedIds,
    capacity,
    friendsLoading,
    friendsError,
    retryFriends,
    submitting: submitState.submitting,
    error: submitState.error,
    open,
    close,
    toggle,
    submit: submitState.submit,
  };
}
