import type { Friend } from "@/features/friends/types/friend.types";
import type { GroupBalancesController } from "@/features/group-expenses/hooks/use-group-balances";
import type { GroupDetailSettlementsController } from "@/features/group-expenses/hooks/use-group-detail-settlements";

import type { GroupDetail } from "../types/group.types";
import type { GroupDetailStatus } from "../utils/group-detail-status";
import type { GroupActivityFeedController } from "./use-group-activity-feed";
import type { GroupDetailExpensesController } from "./use-group-detail-expenses";
import type { GroupDetailMembershipController } from "./use-group-detail-membership";
import type { GroupEditorController } from "./use-group-editor";
import type { GroupInviteMembersController } from "./use-group-invite-members";

export interface UseGroupDetailScreenOptions {
  groupId: string;
  /** Leaves the route after the viewer left the group. */
  onLeft?: () => void;
  /** Opens the settle route from the blocked-balance dialog. */
  onOpenSettle?: () => void;
}

export interface GroupDetailScreenController
  extends GroupDetailMembershipController {
  status: GroupDetailStatus;
  detail: GroupDetail | null;
  viewerUid: string;
  friends: Friend[];
  isOwner: boolean;
  error: string | null;
  refreshing: boolean;
  detailsVisible: boolean;
  editor: GroupEditorController;
  expenses: GroupDetailExpensesController;
  balances: GroupBalancesController;
  settlements: GroupDetailSettlementsController;
  activity: GroupActivityFeedController;
  invite: GroupInviteMembersController;
  reload: () => void;
  refresh: () => void;
  openDetails: () => void;
  closeDetails: () => void;
}
