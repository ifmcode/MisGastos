import type { GroupBalances } from "@/features/group-expenses/types/group-balance.types";
import type { UseConfirmDialogResult } from "@/shared/hooks/use-confirm-dialog";

import type { GroupInvitationItem, GroupMember } from "../types/group.types";
import type { BlockedBalanceVariant } from "../utils/group-membership-copy";

export type GroupMemberPendingAction =
  | "remove"
  | "cancel-invitation"
  | "leave"
  | "transfer";

export type GroupMembershipFailure = "SAVE_FAILED" | "DELETE_FAILED";

export type GroupMembershipRunner = (
  id: string,
  action: GroupMemberPendingAction,
  fallback: GroupMembershipFailure,
  operation: (viewer: string) => Promise<unknown>,
  after: () => void | Promise<void>,
) => Promise<void>;

/** In-flight state, error banner and the settle guard shared by the actions. */
export interface GroupMemberActionsCore {
  pendingId: string | null;
  pendingAction: GroupMemberPendingAction | null;
  error: string | null;
  blockedDialog: UseConfirmDialogResult;
  /** False for the owner: the sheet shows the transfer-first hint instead. */
  canLeave: boolean;
  /** Opens the settle dialog and returns true when the balance is not settled. */
  checkBlocked: (
    memberId: string,
    variant: BlockedBalanceVariant,
    name?: string,
  ) => boolean;
  run: GroupMembershipRunner;
}

export interface UseGroupMemberActionsOptions {
  viewerUid: string | undefined;
  groupId: string;
  groupName: string;
  isOwner: boolean;
  /** Per-currency nets used by the remove/leave pre-check; no extra reads. */
  balances: GroupBalances | null;
  onChanged: () => void | Promise<void>;
  /** Leaves the route once the viewer left the group. */
  onLeft?: () => void;
  /** Opens the settle route from the blocked-balance dialog. */
  onOpenSettle?: () => void;
}

export interface GroupMemberActionsController {
  /** uid of the member, id of the invitation or the viewer leaving. */
  pendingId: string | null;
  pendingAction: GroupMemberPendingAction | null;
  error: string | null;
  removeConfirm: UseConfirmDialogResult;
  cancelConfirm: UseConfirmDialogResult;
  leaveConfirm: UseConfirmDialogResult;
  transferConfirm: UseConfirmDialogResult;
  blockedDialog: UseConfirmDialogResult;
  canLeave: boolean;
  requestRemove: (member: GroupMember) => void;
  requestCancelInvitation: (item: GroupInvitationItem) => void;
  requestLeave: () => void;
  requestTransfer: (member: GroupMember) => void;
}
